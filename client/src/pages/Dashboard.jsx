import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ─── SVG Icons for feature cards ───
const BookIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#3b82f6"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9h18M9 21V9M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5z" />
  </svg>
);
const CalendarIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#3b82f6"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" />
    <path d="M16 2v4M8 2v4M3 10h18" />
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
  </svg>
);
const BotIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#3b82f6"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="7" width="18" height="13" />
    <path d="M8 7V5a2 2 0 0 1 4 0v2" />
    <circle cx="9" cy="13" r="1" fill="#3b82f6" stroke="none" />
    <circle cx="15" cy="13" r="1" fill="#3b82f6" stroke="none" />
    <path d="M9 17h6" strokeWidth="1.5" />
  </svg>
);
const ChatIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#3b82f6"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    <path d="M8 10h8M8 14h5" />
  </svg>
);

const featureCards = [
  {
    icon: <BookIcon />,
    title: "Book Study Room",
    desc: "Reserve a quiet space for your group study sessions or individual focus time.",
    path: "/booking",
    delay: "0s",
  },
  {
    icon: <CalendarIcon />,
    title: "Schedule Librarian",
    desc: "Book a one-on-one consultation with a subject librarian for research help.",
    path: "/scheduling",
    delay: "0.08s",
  },
  {
    icon: <BotIcon />,
    title: "Ask Chatbot",
    desc: "Get instant answers to common library questions regarding hours and policies.",
    path: "/chatbot",
    delay: "0.16s",
  },
  {
    icon: <ChatIcon />,
    title: "Start Live Chat",
    desc: "Connect with a support staff member in real-time during business hours.",
    path: "/livechat",
    delay: "0.24s",
  },
];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Welcome, Student</h1>
        <p className="page-subtitle">
          Access all library services from your personal dashboard.
        </p>
      </div>

      <div className="feature-grid">
        {featureCards.map((card) => (
          <div
            key={card.path}
            className="feature-card"
            style={{ animationDelay: card.delay }}
            onClick={() => navigate(card.path)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && navigate(card.path)}
          >
            <div className="feature-card-icon">{card.icon}</div>
            <div>
              <div className="feature-card-title">{card.title}</div>
              <div className="feature-card-desc">{card.desc}</div>
            </div>
            <button
              className="feature-card-btn"
              onClick={(e) => {
                e.stopPropagation();
                navigate(card.path);
              }}
            >
              Open →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
