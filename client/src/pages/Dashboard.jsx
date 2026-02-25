import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const featureCards = [
  {
    icon: "🚪",
    title: "Book Study Room",
    desc: "Reserve a quiet space for your group study sessions or individual focus time.",
    path: "/booking",
    delay: "0s",
  },
  {
    icon: "🗓",
    title: "Schedule Librarian",
    desc: "Book a one-on-one consultation with a subject librarian for research help.",
    path: "/scheduling",
    delay: "0.08s",
  },
  {
    icon: "🤖",
    title: "Ask Chatbot",
    desc: "Get instant answers to common library questions regarding hours and policies.",
    path: "/chatbot",
    delay: "0.16s",
  },
  {
    icon: "💬",
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
