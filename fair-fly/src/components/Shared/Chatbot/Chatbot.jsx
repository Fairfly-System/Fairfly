import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchServices } from "../../../services/serviceService";
import { fetchChatbotConfig, fetchChatbotFaqs } from "../../../services/chatbotService";
import { buildGeminiSystemInstruction } from "./botPersona";
import "./chatbot.css"; 

export default function Chatbot() {
  const location = useLocation();
  const isHiddenRoute =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/operator");

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "model",
      text: "Hello! I'm Fairfly AI Assistant. How can I help you today? I can answer questions about our services, requirements, and processing times.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [catalogStatus, setCatalogStatus] = useState("loading");
  const [configStatus, setConfigStatus] = useState("loading");
  const [services, setServices] = useState([]);
  const [chatbotConfig, setChatbotConfig] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isHiddenRoute) return undefined;

    let isMounted = true;

    fetchServices(
      (data) => {
        if (!isMounted) return;

        const activeServices = (Array.isArray(data) ? data : []).filter(
          (service) => service.status !== "Disabled" && service.status !== "Inactive"
        );
        setServices(activeServices);
        setCatalogStatus(activeServices.length > 0 ? "ready" : "unavailable");
      },
      (error) => {
        if (!isMounted) return;

        console.error("Service catalog Error:", error);
        setCatalogStatus("unavailable");
      }
    );

    fetchChatbotConfig(
      (data) => {
        if (!isMounted) return;
        setChatbotConfig(data);
        setConfigStatus(data?.systemInstruction ? "ready" : "unavailable");
      },
      (error) => {
        if (!isMounted) return;
        console.error("Chatbot config Error:", error);
        setConfigStatus("unavailable");
      }
    );

    fetchChatbotFaqs(
      (data) => {
        if (!isMounted) return;
        setFaqs(Array.isArray(data) ? data : []);
      },
      (error) => {
        if (!isMounted) return;
        console.error("Chatbot FAQ Error:", error);
      }
    );

    return () => {
      isMounted = false;
    };
  }, [isHiddenRoute]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (e, selectedPrompt = "") => {
    e?.preventDefault();
    const messageToSend = selectedPrompt || input.trim();
    if (!messageToSend || loading || catalogStatus !== "ready" || configStatus !== "ready") return;

    const userMessage = messageToSend;
    setInput("");
    setLoading(true);

    const updatedMessages = [...messages, { role: "user", text: userMessage }];
    setMessages(updatedMessages);

    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
        systemInstruction: buildGeminiSystemInstruction(services, chatbotConfig),
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
        fallbackText = "Slow down a bit! You've hit Google's temporary limit. Please wait about a minute before sending your next message, thanks!";
      }

      setMessages([
        ...updatedMessages,
        { role: "model", text: fallbackText },
      ]);
    }finally {
          setLoading(false);
        }
      };

  if (isHiddenRoute) {
    return null;
  }

  return (
    <>
      {/* FLOATING LAUNCHER BUTTON */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="chatbot-launcher">
          <i className="fa-solid fa-message"></i>
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
                  <span className="chatbot-green-dot"></span>
                  {configStatus !== "ready" || catalogStatus === "loading" ? " Loading chatbot..." : catalogStatus === "ready" ? " Online Now" : " Temporarily unavailable"}
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="chatbot-close-button"><i className="fa-solid fa-circle-xmark"></i></button>
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

          {faqs.length > 0 && (
            <div className="chatbot-quick-access" aria-label="Frequently asked questions">
              <span className="chatbot-quick-access-title">Quick questions</span>
              <div className="chatbot-quick-access-list">
                {faqs.map((faq) => (
                  <button
                    type="button"
                    key={faq.id}
                    className="chatbot-quick-access-button"
                    onClick={() => handleSend(null, faq.prompt)}
                    disabled={loading || catalogStatus !== "ready" || configStatus !== "ready"}
                  >
                    {faq.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer Input Form */}
          <form onSubmit={handleSend} className="chatbot-input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={catalogStatus === "ready" ? "Ask me anything..." : "Service information is unavailable"}
              className="chatbot-input-field"
              disabled={loading || catalogStatus !== "ready" || configStatus !== "ready"}
            />
            <button type="submit" className="chatbot-send-button" disabled={loading || catalogStatus !== "ready" || configStatus !== "ready" || !input.trim()}><i className="fa-regular fa-paper-plane"></i></button>
          </form>
        </div>
      )}
    </>
  );
}