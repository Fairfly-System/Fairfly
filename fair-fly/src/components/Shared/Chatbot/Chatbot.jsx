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
  const [isClosing, setIsClosing] = useState(false);
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
  const quickAccessRef = useRef(null);

  const scrollQuickQuestions = (direction) => {
    if (quickAccessRef.current) {
      const amount = direction === "left" ? -140 : 140;
      quickAccessRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

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

  const handleOpen = () => {
    setIsOpen(true);
    setIsClosing(false);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 220);
  };

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
        const replyText =
          res?.reply ||
          "I'm here to help you learn more about Fairfly's services and branch locations! Feel free to ask about what we offer.";
        setMessages([...updatedMessages, { role: "model", text: replyText }]);
        setLoading(false);
      },
      (error) => {
        const errorString = error?.message || error?.toString() || "";
        let fallbackText = "Oops, something went wrong. Please try again in a bit!";

        if (errorString.includes("429") || errorString.includes("quota")) {
          fallbackText =
            "Slow down a bit! You've hit a temporary limit. Please wait about a minute before sending your next message, thanks!";
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
      {/* BLOCKY FLOATING LAUNCHER BUTTON */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="chatbot-launcher"
          aria-label="Open Fairfly AI chat"
        >
          <i className="fa-solid fa-message"></i>
        </button>
      )}

      {/* EXPANDED CHAT BOX WINDOW (WITH OPEN / CLOSE ANIMATIONS) */}
      {(isOpen || isClosing) && (
        <div className={`chatbot-box ${isClosing ? "chatbot-closing" : "chatbot-opening"}`}>
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <span className="chatbot-bot-name">Fairfly AI Assistant</span>
              <span className="chatbot-status">
                <span className="chatbot-powered-tag">Powered by Gemini</span>
                <span className="chatbot-status-sep">·</span>
                <span className="chatbot-green-dot"></span>
                <span>Online</span>
              </span>
            </div>
            <button
              onClick={handleClose}
              className="chatbot-close-button"
              aria-label="Close chat"
            >
              <i className="fa-solid fa-xmark"></i>
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
                <div className="chatbot-bubble model typing" aria-label="Assistant is typing">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick FAQ Suggestion Chips */}
          {faqs.length > 0 && (
            <div className="chatbot-quick-access" aria-label="Frequently asked questions">
              <div className="chatbot-quick-access-header">
                <span className="chatbot-quick-access-title">Quick questions</span>
                <div className="chatbot-quick-nav">
                  <button
                    type="button"
                    className="chatbot-quick-nav-btn"
                    onClick={() => scrollQuickQuestions("left")}
                    aria-label="Scroll left"
                  >
                    <i className="fa-solid fa-chevron-left"></i>
                  </button>
                  <button
                    type="button"
                    className="chatbot-quick-nav-btn"
                    onClick={() => scrollQuickQuestions("right")}
                    aria-label="Scroll right"
                  >
                    <i className="fa-solid fa-chevron-right"></i>
                  </button>
                </div>
              </div>
              <div
                ref={quickAccessRef}
                className="chatbot-quick-access-list"
                onWheel={(e) => {
                  if (e.deltaY !== 0) {
                    e.currentTarget.scrollLeft += e.deltaY;
                  }
                }}
              >
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