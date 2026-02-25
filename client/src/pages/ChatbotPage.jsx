import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

// --------------- Tier 1: Rule-Based FAQ ---------------
const FAQ = [
  {
    patterns: ["hour", "open", "close", "time", "when"],
    answer:
      "🕐 **Library Hours:**\n• Monday–Friday: 8:00 AM – 10:00 PM\n• Saturday: 9:00 AM – 6:00 PM\n• Sunday: 12:00 PM – 6:00 PM",
  },
  {
    patterns: ["location", "where", "address", "find", "building"],
    answer:
      "📍 **Location:** The library is located in the **Main Campus Building, Block C**, Ground & First Floor. Follow the blue signs from the main entrance.",
  },
  {
    patterns: ["food", "drink", "eat", "snack"],
    answer:
      "🍎 **Food & Drink Policy:** Light snacks and covered drinks are allowed in designated areas only. No food is permitted in the silent reading zones.",
  },
  {
    patterns: ["noise", "quiet", "silent", "talk"],
    answer:
      "🤫 **Noise Policy:** The ground floor is a silent zone — no conversations. The first floor allows quiet discussions. Group rooms can be booked for collaborative work.",
  },
  {
    patterns: ["book", "borrow", "loan", "return", "checkout"],
    answer:
      "📚 **Borrowing Books:** Students can borrow up to **5 books** for 2 weeks. Returns can be made at the front desk or the 24hr drop box near the main entrance.",
  },
  {
    patterns: ["wifi", "internet", "network", "connect"],
    answer:
      '📶 **WiFi:** Connect to **"UNI-LIB"** network. Use your student ID and password. Speed is up to 100 Mbps. IT support: ext. 4455.',
  },
  {
    patterns: ["room", "study room", "space", "reserve", "booking"],
    answer:
      "🚪 **Study Room Booking:** You can book a study room directly from the **Study Room Booking** section in this app! Rooms can be reserved up to 7 days in advance.",
  },
  {
    patterns: ["meeting", "librarian", "appointment", "consult"],
    answer:
      "🗓 **Schedule a Librarian:** Use the **Librarian Scheduling** feature in this app to book a one-on-one consultation for research help, referencing, and more.",
  },
  {
    patterns: ["print", "scan", "copy", "printer"],
    answer:
      "🖨️ **Printing:** Printers are available on both floors. Cost: 5¢/page (B&W), 20¢/page (colour). Load credit at the self-service kiosk with your student card.",
  },
  {
    patterns: [
      "database",
      "journal",
      "research",
      "resource",
      "jstor",
      "academic",
    ],
    answer:
      "🔬 **Research Databases:** Access JSTOR, PubMed, Scopus, and more via the library portal at **library.university.edu/databases**. Log in with your student credentials.",
  },
];

const getBotReply = (msg) => {
  const lower = msg.toLowerCase();
  const found = FAQ.find((faq) => faq.patterns.some((p) => lower.includes(p)));
  return found ? found.answer : null;
};

const formatTime = (d) =>
  d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const QUICK_QUESTIONS = [
  "What are the library hours?",
  "Where is the library?",
  "How do I book a room?",
  "WiFi details?",
  "Food & drink policy?",
];

const WELCOME = {
  id: "welcome",
  role: "bot",
  text: "👋 Hi! I'm **LibBot**, your library assistant.\n\nI can answer questions about library hours, location, policies, and resources.\n\nFor complex queries, I'll escalate to our AI. Type your question or pick one below!",
  time: new Date(),
};

const ChatbotPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (role, text) => {
    setMessages((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), role, text, time: new Date() },
    ]);
  };

  const sendMessage = async (text) => {
    const question = text.trim();
    if (!question) return;
    setInput("");
    addMessage("user", question);
    setLoading(true);

    // Tier 1: Rule-based
    const t1 = getBotReply(question);
    if (t1) {
      await new Promise((r) => setTimeout(r, 500));
      addMessage("bot", t1);
      setLoading(false);
      return;
    }

    // Tier 2: AI/NLP (via /api/ai)
    try {
      await new Promise((r) => setTimeout(r, 900)); // simulate API
      // TODO: replace with: const res = await axios.post('/api/ai', { message: question }, { headers: { Authorization: `Bearer ${user.token}` } });
      addMessage(
        "bot",
        "🤖 That's a great question! For detailed information, please contact a librarian directly via **Live Chat** or schedule a meeting. I'm still learning!",
      );
    } catch {
      addMessage(
        "bot",
        "⚠️ AI service is temporarily unavailable. Please try Live Chat to speak with a librarian.",
      );
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="page-container" style={{ paddingBottom: 0 }}>
      <div className="page-header">
        <h1 className="page-title">Chatbot Assistance</h1>
        <p className="page-subtitle">
          Ask about library policies, resources, or get guided to the right
          service.
        </p>
      </div>

      <div className="chat-container">
        {/* Messages */}
        <div className="chat-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-message ${msg.role}`}>
              <div className="chat-bubble" style={{ whiteSpace: "pre-line" }}>
                {msg.text
                  .split("**")
                  .map((part, i) =>
                    i % 2 === 1 ? <strong key={i}>{part}</strong> : part,
                  )}
              </div>
              <div className="chat-time">{formatTime(msg.time)}</div>
            </div>
          ))}
          {loading && (
            <div className="chat-message bot">
              <div
                className="chat-bubble"
                style={{ display: "flex", gap: "4px", alignItems: "center" }}
              >
                <span
                  style={{
                    animation: "pulse 1s infinite",
                    animationDelay: "0s",
                  }}
                >
                  ●
                </span>
                <span
                  style={{
                    animation: "pulse 1s infinite",
                    animationDelay: "0.2s",
                  }}
                >
                  ●
                </span>
                <span
                  style={{
                    animation: "pulse 1s infinite",
                    animationDelay: "0.4s",
                  }}
                >
                  ●
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick Questions */}
        <div className="quick-btns">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              className="quick-btn"
              onClick={() => sendMessage(q)}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="chat-input-row">
          <input
            className="form-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message…"
            disabled={loading}
            autoFocus
          />
          <button
            className="btn btn-primary"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;
