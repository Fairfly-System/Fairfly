import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router";
import { fetchChatbotFaqs, sendChatbotMessage } from "../../../services/chatbotService";
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
      text: "Hello! I'm Fairfly AI Assistant. How can I help you today? I can answer questions about our services, requirements, processing times, and branch locations.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [faqs, setFaqs] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isHiddenRoute) return undefined;

    let isMounted = true;

    fetchChatbotFaqs(
      (data) => {
        if (!isMounted) return;
        setFaqs(Array.isArray(data) ? data : []);
      },
      () => {
        // Fallback silently if offline or network error
      }
    );

    return () => {
      isMounted = false;
    };
  }, [isHiddenRoute]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = (e, selectedPrompt = "") => {
    e?.preventDefault();
    const messageToSend = selectedPrompt || input.trim();
    if (!messageToSend || loading) return;

    const userMessage = messageToSend;
    setInput("");
    setLoading(true);

    const updatedMessages = [...messages, { role: "user", text: userMessage }];
    setMessages(updatedMessages);

    // Format conversational history (excluding default greeting)
    const history = messages
      .filter((_, index) => index > 0)
      .map((msg) => ({
        role: msg.role === "model" ? "model" : "user",
        text: msg.text,
      }));

    sendChatbotMessage(
      { message: userMessage, history },
      (res) => {
        const replyText = res?.reply || "I'm here to help you learn more about Fairfly's services and branch locations! Feel free to ask about what we offer.";
        setMessages([...updatedMessages, { role: "model", text: replyText }]);
        setLoading(false);
      },
      (error) => {
        const errorString = error?.message || error?.toString() || "";
        let fallbackText = "Oops, something went wrong. Please try again in a bit!";

        if (errorString.includes("429") || errorString.includes("quota")) {
          fallbackText = "Slow down a bit! You've hit a temporary limit. Please wait about a minute before sending your next message, thanks!";
        }

        setMessages([
          ...updatedMessages,
          { role: "model", text: fallbackText },
        ]);
        setLoading(false);
      }
    );
  };

  if (isHiddenRoute) {
    return null;
  }

  return (
    <>
      {/* FLOATING LAUNCHER BUTTON */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="chatbot-launcher"
          aria-label="Open Fairfly AI chat"
        >
          <i className="fa-solid fa-message"></i>
        </button>
      )}

      {/* EXPANDED CHAT BOX WINDOW */}
      {isOpen && (
        <div className="chatbot-box">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-avatar-container">
              <div className="chatbot-avatar-placeholder">
                <img src="/FairflyLogo.png" alt="Fairfly Logo" />
              </div>
              <div className="chatbot-header-info">
                <span className="chatbot-bot-name">Chat with Fairfly</span>
                <span className="chatbot-status">
                  <span className="chatbot-green-dot"></span>
                  Online Now
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="chatbot-close-button"
              aria-label="Close chat"
            >
              <i className="fa-solid fa-circle-xmark"></i>
            </button>
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

          {/* Quick FAQ Suggestion Chips */}
          {faqs.length > 0 && (
            <div className="chatbot-quick-access" aria-label="Frequently asked questions">
              <span className="chatbot-quick-access-title">Quick questions</span>
              <div className="chatbot-quick-access-list">
                {faqs.map((faq) => (
                  <button
                    type="button"
                    key={faq.id || faq.label}
                    className="chatbot-quick-access-button"
                    onClick={() => handleSend(null, faq.prompt)}
                    disabled={loading}
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
              placeholder="Ask about services, branches, requirements..."
              className="chatbot-input-field"
              disabled={loading}
            />
            <button
              type="submit"
              className="chatbot-send-button"
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              <i className="fa-regular fa-paper-plane"></i>
            </button>
          </form>
        </div>
      )}
    </>
  );
}