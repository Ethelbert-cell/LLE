import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const formatTime = (d) =>
  new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// Each student gets a unique room ID based on their user ID
const getRoomId = (userId) => `live-${userId}`;

const LiveChatPage = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: "sys-1",
      senderName: "System",
      senderRole: "system",
      content:
        "👋 Welcome to Live Chat! A librarian will be with you shortly during business hours (Mon–Fri 8AM–6PM).",
      createdAt: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const roomId = getRoomId(user?._id || "guest");

  useEffect(() => {
    // Connect Socket.IO
    socketRef.current = io(SOCKET_URL, { transports: ["websocket"] });

    socketRef.current.on("connect", () => {
      setConnected(true);
      socketRef.current.emit("join_room", roomId);
    });

    socketRef.current.on("disconnect", () => setConnected(false));

    socketRef.current.on("receive_message", (data) => {
      // Only add messages not sent by current socket to avoid duplicates
      if (data.socketId !== socketRef.current.id) {
        setMessages((prev) => [...prev, data]);
      }
    });

    return () => socketRef.current?.disconnect();
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;

    const msg = {
      id: Date.now(),
      socketId: socketRef.current?.id,
      senderName: user?.name || "Student",
      senderRole: user?.role || "student",
      content: text,
      roomId,
      createdAt: new Date(),
    };

    // Render immediately for sender
    setMessages((prev) => [...prev, msg]);
    // Broadcast via Socket.IO
    socketRef.current?.emit("send_message", msg);
    setInput("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isStudent = (role) => role === "student";

  return (
    <div className="page-container" style={{ paddingBottom: 0 }}>
      <div
        className="page-header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1 className="page-title">Live Chat</h1>
          <p className="page-subtitle">
            Connect with a librarian in real-time. Available Mon–Fri, 8AM–6PM.
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.78rem",
            color: connected ? "#4ade80" : "var(--text-muted)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: connected ? "#4ade80" : "#6b7280",
              display: "inline-block",
            }}
          />
          {connected ? "Connected" : "Connecting…"}
        </div>
      </div>

      <div className="chat-container">
        {/* Messages */}
        <div className="chat-messages">
          {messages.map((msg) => {
            const isMine =
              msg.senderRole === "student" && msg.senderName === user?.name;
            const isSystem = msg.senderRole === "system";
            return (
              <div
                key={msg.id}
                className={`chat-message ${isMine ? "user" : "bot"}`}
              >
                {!isMine && !isSystem && (
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-muted)",
                      marginBottom: "0.2rem",
                      paddingLeft: "0.25rem",
                    }}
                  >
                    {msg.senderRole === "admin"
                      ? "📚 Librarian"
                      : msg.senderName}
                  </div>
                )}
                <div
                  className="chat-bubble"
                  style={
                    isSystem
                      ? {
                          background: "rgba(59,130,246,0.08)",
                          border: "1px dashed rgba(59,130,246,0.2)",
                          color: "var(--text-secondary)",
                          fontSize: "0.8rem",
                          fontStyle: "italic",
                          alignSelf: "center",
                          maxWidth: "80%",
                        }
                      : undefined
                  }
                >
                  {msg.content}
                </div>
                <div className="chat-time">{formatTime(msg.createdAt)}</div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="chat-input-row">
          <input
            className="form-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message to the librarian…"
            autoFocus
          />
          <button
            className="btn btn-primary"
            onClick={sendMessage}
            disabled={!input.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveChatPage;
