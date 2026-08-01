import React, { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_SYSTEM_INSTRUCTION } from "./botPersona";
import "./chatbot.css"; 

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "model",
      text: "Hello! I'm Fairfly AI Assistant. How can I help you today? I can answer questions about our services, requirements, and processing times.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    const updatedMessages = [...messages, { role: "user", text: userMessage }];
    setMessages(updatedMessages);

    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
        systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
      });

      
      const history = messages
        .filter((_, index) => index > 0)
        .map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.text }],
        }));

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(userMessage);
      const responseText = result.response.text();

      setMessages([...updatedMessages, { role: "model", text: responseText }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      
      const errorString = error.toString();
      
      let fallbackText = "Oops, Something went wrong. Please try again in a bit!";
      
      if (errorString.includes("429") || errorString.includes("quota")) {
        fallbackText = "Slow down a bit! ☕ You've hit Google's temporary limit. Please wait about a minute before sending your next message, thanks!";
      }

      setMessages([
        ...updatedMessages,
        { role: "model", text: fallbackText },
      ]);
    }finally {
          setLoading(false);
        }
      };

  return (
    <>
      {/* FLOATING LAUNCHER BUTTON */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="chatbot-launcher">
          <i class="fa-solid fa-message"></i>
        </button>
      )}

      {/* EXPANDED CHAT BOX WINDOW */}
      {isOpen && (
        <div className="chatbot-box">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-avatar-container">
              <div className="chatbot-avatar-placeholder"><img src="FairflyLogo.png"></img></div>
              <div className="chatbot-header-info">
                <span className="chatbot-bot-name">Chat with Fairfly</span>
                <span className="chatbot-status">
                  <span className="chatbot-green-dot"></span> Online Now
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="chatbot-close-button"><i class="fa-solid fa-circle-xmark"></i></button>
          </div>

          {/* Messages Feed */}
          <div className="chatbot-messages-window">
            {messages.map((msg, index) => (
              <div key={index} className={`chatbot-message-row ${msg.role}`}>
                <div className={`chatbot-bubble ${msg.role}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chatbot-message-row model">
                <div className="chatbot-typing-indicator">Typing...</div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Footer Input Form */}
          <form onSubmit={handleSend} className="chatbot-input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="chatbot-input-field"
              disabled={loading}
            />
            <button type="submit" className="chatbot-send-button" disabled={loading}><i class="fa-regular fa-paper-plane"></i></button>
          </form>
        </div>
      )}
    </>
  );
}