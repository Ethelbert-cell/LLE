import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

// ─── Tier 1: Rule-based FAQ ───────────────────────────────────────────────────
// IMPORTANT RULES for adding keywords:
//   • Only use multi-word phrases or rare specific words as keywords
//   • Never use short generic words like: eat, time, open, study, book, water, talk
//     alone — they appear as substrings inside unrelated words (e.g. "eat" in "feathers")
//   • Use the phrases[] array for specific multi-word triggers
//   • Use keywords[] only for unambiguous standalone terms
const FAQ = [
  // ── Room Booking (must come BEFORE borrowing) ─────────────────────────────
  {
    phrases: [
      "book a room",
      "reserve a room",
      "book a study room",
      "study room booking",
      "how do i book",
      "how to book a",
      "book study",
      "reserve study",
      "book the room",
      "room reservation",
      "book the study",
    ],
    keywords: ["study room", "room booking", "room reservation"],
    answer:
      "🚪 **Study Room Booking:**\nYou can book a study room directly in this app!\n\n• Go to **Study Room Booking** in the sidebar\n• Choose a room, pick a date and time\n• Rooms can be reserved up to **7 days in advance**\n• Cancellations must be made at least 1 hour before",
  },

  // ── Library Hours ─────────────────────────────────────────────────────────
  {
    phrases: [
      "library hours",
      "library opening hours",
      "library closing hours",
      "when does the library open",
      "when does the library close",
      "what time does the library",
      "is the library open",
      "library schedule",
      "library timetable",
      "library open on",
      "library close on",
      "library open today",
    ],
    keywords: ["library hours", "library schedule", "library timetable"],
    answer:
      "🕐 **Library Hours:**\n• Monday – Friday: 8:00 AM – 10:00 PM\n• Saturday: 9:00 AM – 6:00 PM\n• Sunday: 12:00 PM – 6:00 PM\n\nHours may vary on public holidays — check the notice board.",
  },

  // ── Location ──────────────────────────────────────────────────────────────
  {
    phrases: [
      "where is the library",
      "library location",
      "library address",
      "how do i find the library",
      "how to get to the library",
      "library building",
      "where can i find the library",
      "direct me to the library",
    ],
    keywords: ["library location", "library address"],
    answer:
      "📍 **Location:** The library is in the **Main Campus Building, Block C**, Ground & First Floor.\nFollow the blue directional signs from the main entrance.",
  },

  // ── Book Borrowing ─────────────────────────────────────────────────────────
  {
    phrases: [
      "borrow a book",
      "borrow books",
      "return a book",
      "return books",
      "loan a book",
      "book loan",
      "renew a book",
      "overdue book",
      "book fine",
      "book checkout",
      "check out a book",
    ],
    keywords: ["overdue book", "book loan", "book return", "book fine"],
    answer:
      "📚 **Borrowing Books:**\n• Students can borrow up to **5 books** for **2 weeks**\n• Renew online at library.university.edu or at the front desk\n• Returns: front desk or the **24hr drop box** near the main entrance\n• Overdue fee: 10¢ per day",
  },

  // ── Librarian / Scheduling ─────────────────────────────────────────────────
  {
    phrases: [
      "schedule a librarian",
      "book a librarian",
      "meet a librarian",
      "librarian appointment",
      "speak to a librarian",
      "talk to a librarian",
      "librarian meeting",
      "librarian consultation",
      "see a librarian",
      "appointment with librarian",
    ],
    keywords: [
      "librarian appointment",
      "librarian meeting",
      "librarian consultation",
    ],
    answer:
      "🗓 **Librarian Scheduling:**\nUse the **Librarian Scheduling** page in this app to book a one-on-one consultation.\n\n• Research help & referencing\n• Academic writing support\n• Database navigation\n• Available Mon–Fri, 9 AM – 5 PM",
  },

  // ── WiFi ──────────────────────────────────────────────────────────────────
  {
    phrases: [
      "wifi password",
      "wifi details",
      "connect to wifi",
      "library wifi",
      "internet access at the library",
      "library internet",
      "library wi-fi",
      "how do i connect to wifi",
      "what is the wifi",
    ],
    keywords: ["library wifi", "library wi-fi", "library internet"],
    answer:
      '📶 **WiFi Access:**\n• Network: **"UNI-LIB"**\n• Login: your student ID + password\n• Speed: up to 100 Mbps\n• IT Support: ext. 4455 or it@university.edu',
  },

  // ── Food & Drink ──────────────────────────────────────────────────────────
  {
    phrases: [
      "food policy",
      "drink policy",
      "eating in the library",
      "drinking in the library",
      "can i eat in the library",
      "can i drink in the library",
      "bring food to the library",
      "is food allowed",
      "food allowed",
      "food and drink policy",
      "library food",
      "library drink",
    ],
    keywords: ["food policy", "drink policy", "library food", "library cafe"],
    answer:
      "🍎 **Food & Drink Policy:**\n• Light snacks and **covered drinks** are allowed in designated areas\n• No food in the **silent reading zones** (Ground Floor)\n• A café is available on Level 2",
  },

  // ── Noise / Quiet ─────────────────────────────────────────────────────────
  {
    phrases: [
      "noise policy",
      "can i talk in the library",
      "is the library silent",
      "silent zone",
      "quiet zone",
      "library noise policy",
      "how loud can i be",
      "library talking",
    ],
    keywords: ["noise policy", "silent zone", "quiet zone", "library noise"],
    answer:
      "🤫 **Noise Policy:**\n• **Ground Floor** → Strictly silent zone\n• **First Floor** → Quiet discussions allowed\n• **Group Study Rooms** → Full collaboration welcome — book one in the app!",
  },

  // ── Printing ──────────────────────────────────────────────────────────────
  {
    phrases: [
      "how do i print",
      "print a document",
      "printing cost",
      "how much to print",
      "print at the library",
      "library printer",
      "scan a document",
      "photocopying",
      "library printing",
      "can i print",
    ],
    keywords: ["library printer", "library printing", "printing cost"],
    answer:
      "🖨️ **Printing & Scanning:**\n• Available on both floors\n• B&W: 5¢/page | Colour: 20¢/page\n• Load credit with your student card at the self-service kiosk\n• Scanning to email is free",
  },

  // ── Research / Databases ──────────────────────────────────────────────────
  {
    phrases: [
      "research database",
      "academic database",
      "find a journal",
      "find an article",
      "jstor",
      "pubmed",
      "scopus",
      "library database",
      "access journals",
      "online resources",
      "library resources",
    ],
    keywords: [
      "jstor",
      "pubmed",
      "scopus",
      "library database",
      "library resources",
    ],
    answer:
      "🔬 **Research Databases:**\nAccess **JSTOR, PubMed, Scopus, ProQuest** and more via the library portal:\n📌 library.university.edu/databases\n• Log in with your student credentials\n• Need help? Schedule a librarian session!",
  },

  // ── What is LLE ───────────────────────────────────────────────────────────
  {
    phrases: [
      "what is lle",
      "what does lle mean",
      "what is this app",
      "about lle",
      "about this system",
      "what is this system",
      "what is lle library",
      "explain lle",
    ],
    keywords: ["what is lle", "about lle", "lle system"],
    answer:
      "ℹ️ **About LLE:**\nLLE is the **Library Learning Environment** — a digital support system for university students.\n\nIt gives you:\n• 📅 Study room booking\n• 🗓 Librarian scheduling\n• 🤖 AI chatbot assistance\n• 💬 Live chat with library staff\n\nAll in one place!",
  },
];

/**
 * Word-boundary aware match — prevents "eat" inside "feathers",
 * "time" inside "sometime", "open" inside "opener", etc.
 */
const wordBoundaryMatch = (text, keyword) => {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
};

/**
 * Two-pass FAQ matcher:
 * Pass 1 — phrase match (substring on full phrases — safe because phrases are specific)
 * Pass 2 — whole-word keyword match (prevents partial word false-positives)
 * Returns null if nothing matches → Groq AI takes over
 */
const getBotReply = (msg) => {
  const lower = msg.toLowerCase();

  // Pass 1: specific phrase match
  const phraseHit = FAQ.find((faq) =>
    faq.phrases.some((phrase) => lower.includes(phrase.toLowerCase())),
  );
  if (phraseHit) return phraseHit.answer;

  // Pass 2: whole-word keyword match
  const keywordHit = FAQ.find((faq) =>
    faq.keywords.some((kw) => wordBoundaryMatch(lower, kw)),
  );
  return keywordHit ? keywordHit.answer : null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTime = (d) =>
  d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const QUICK_QUESTIONS = [
  "What are the library hours?",
  "How do I book a room?",
  "What is LLE?",
  "WiFi details?",
  "Food & drink policy?",
];

const WELCOME = {
  id: "welcome",
  role: "bot",
  text: "👋 Hi! I'm **LibBot**, your university library assistant.\n\nAsk me anything about library hours, policies, resources, or how to use this app. If I can't answer, I'll route your question to our AI.\n\nPick a quick question below or type your own!",
  time: new Date(),
};

const renderText = (text) =>
  text
    .split("**")
    .map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));

// ─── Component ────────────────────────────────────────────────────────────────
const ChatbotPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (role, text) => {
    const msg = {
      id: Date.now() + Math.random(),
      role,
      text,
      time: new Date(),
    };
    setMessages((prev) => [...prev, msg]);
    return msg;
  };

  const sendMessage = async (text) => {
    const question = text.trim();
    if (!question) return;
    setInput("");
    addMessage("user", question);
    setLoading(true);

    // ── Tier 1: Rule-based FAQ ─────────────────────────────────────────────
    const t1Reply = getBotReply(question);
    if (t1Reply) {
      await new Promise((r) => setTimeout(r, 400));
      addMessage("bot", t1Reply);
      setLoading(false);
      return;
    }

    // ── Tier 2: Groq AI via /api/ai ────────────────────────────────────────
    try {
      const res = await axios.post(
        "/api/ai",
        { message: question, history: conversationHistory.slice(-6) },
        { headers: { Authorization: `Bearer ${user?.token}` } },
      );

      const aiReply = res.data.reply;
      addMessage("bot", aiReply);
      setConversationHistory((prev) => [
        ...prev,
        { role: "user", content: question },
        { role: "assistant", content: aiReply },
      ]);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        addMessage(
          "bot",
          "⚠️ Session expired — please refresh the page and try again.",
        );
      } else {
        addMessage(
          "bot",
          "⚠️ AI service is temporarily unavailable. Please try **Live Chat** to speak with a librarian directly.",
        );
      }
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
                {renderText(msg.text)}
              </div>
              <div className="chat-time">{formatTime(msg.time)}</div>
            </div>
          ))}

          {loading && (
            <div className="chat-message bot">
              <div
                className="chat-bubble"
                style={{ display: "flex", gap: "5px", alignItems: "center" }}
              >
                {[0, 0.2, 0.4].map((delay, i) => (
                  <span
                    key={i}
                    style={{
                      animation: "pulse 1s infinite",
                      animationDelay: `${delay}s`,
                    }}
                  >
                    ●
                  </span>
                ))}
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
              disabled={loading}
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
            placeholder="Ask anything about the library…"
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
