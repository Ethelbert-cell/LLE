import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { io } from "socket.io-client";
import axios from "axios";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const formatTime = (d) =>
  new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const LiveChatPage = () => {
  const { user } = useAuth();
  const headers = { Authorization: `Bearer ${user?.token}` };

  const [session, setSession] = useState(null); // The active chat session object
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds

  const [messages, setMessages] = useState([
    {
      id: "sys-1",
      senderName: "System",
      senderRole: "system",
      content: "👋 Welcome to Live Chat! A librarian will be with you shortly.",
      createdAt: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);

  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const timerRef = useRef(null);

  // 1. Initial Load: Auto-fetch status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get("/api/chat/status", { headers });
        if (res.data.activeSession) {
          setSession(res.data.activeSession);
          loadHistory(res.data.activeSession.roomId);
        }
      } catch (err) {
        console.error("Failed to fetch chat status", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [user]);

  // Load message history if rejoining
  const loadHistory = async (roomId) => {
    try {
      const res = await axios.get(`/api/chat/history/${roomId}`, { headers });
      if (res.data && res.data.length > 0) {
        setMessages((prev) => [prev[0], ...res.data]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Setup Timer when session is active
  useEffect(() => {
    if (session && session.status === "Ongoing") {
      const start = new Date(session.startTime).getTime();
      const current = Date.now();
      const passedElapsed = Math.floor((current - start) / 1000);
      const remainingInit = Math.max(0, 30 * 60 - passedElapsed);

      setTimeLeft(remainingInit);

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0; // Trigger timeout state if strictly local? Or let cron handle it.
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
  }, [session]);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // 3. Setup Socket.IO
  useEffect(() => {
    if (session && session.status === "Ongoing") {
      socketRef.current = io(SOCKET_URL, { transports: ["websocket"] });

      socketRef.current.on("connect", () => {
        setConnected(true);
        socketRef.current.emit("join_room", session.roomId);
      });

      socketRef.current.on("disconnect", () => setConnected(false));

      socketRef.current.on("receive_message", (data) => {
        if (data.socketId !== socketRef.current.id) {
          setMessages((prev) => [...prev, data]);
        }
      });

      socketRef.current.on("session_ended", (data) => {
        setSession(null);
        alert(data.message || "Session has ended.");
      });

      return () => socketRef.current?.disconnect();
    }
  }, [session?.roomId, session?.status]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, session]);

  // 4. Input & Request handlers
  const requestChat = async () => {
    setRequesting(true);
    try {
      const res = await axios.post("/api/chat/request", {}, { headers });
      setSession(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to start chat session.");
    } finally {
      setRequesting(false);
    }
  };

  const endSession = async () => {
    if (!session) return;
    try {
      await axios.put(`/api/chat/session/${session._id}/end`, {}, { headers });
      setSession(null);
      setMessages([
        {
          id: "sys-1",
          senderName: "System",
          senderRole: "system",
          content:
            "Chat ended manually. Start a new session if you need further help.",
          createdAt: new Date(),
        },
      ]);
    } catch (err) {
      alert("Failed to end session.");
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !session) return;

    try {
      const msgData = { content: text, roomId: session.roomId };
      const res = await axios.post("/api/chat/message", msgData, { headers });
      const msgObj = { ...res.data, socketId: socketRef.current?.id };

      setMessages((prev) => [...prev, msgObj]);
      socketRef.current?.emit("send_message", msgObj);
      setInput("");
    } catch (err) {
      alert("Failed to send message.");
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="page-container" style={{ paddingBottom: 0 }}>
      {/* Header */}
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

        {session && (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
              style={{
                background:
                  timeLeft < 300
                    ? "rgba(239,68,68,0.1)"
                    : "rgba(59,130,246,0.1)",
                padding: "0.5rem 1rem",
                borderRadius: "1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                border: `1px solid ${timeLeft < 300 ? "rgba(239,68,68,0.2)" : "rgba(59,130,246,0.2)"}`,
              }}
            >
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  color: timeLeft < 300 ? "#ef4444" : "var(--accent-blue)",
                }}
              >
                ⏱ {formatTimer(timeLeft)}
              </span>
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
        )}
      </div>

      <div className="chat-container">
        {loading ? (
          <div
            style={{
              height: "400px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "var(--text-muted)",
            }}
          >
            Loading...
          </div>
        ) : !session ? (
          <div
            style={{
              height: "400px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              color: "var(--text-muted)",
              gap: "1.5rem",
            }}
          >
            <div style={{ fontSize: "3rem" }}>💬</div>
            <p style={{ maxWidth: 400, textAlign: "center", lineHeight: 1.6 }}>
              You do not have an active chat session. Start a new session to
              connect with an available librarian.
            </p>
            <button
              className="btn btn-primary"
              onClick={requestChat}
              disabled={requesting}
            >
              {requesting ? "Requesting..." : "Start Live Chat"}
            </button>
          </div>
        ) : (
          <>
            {/* Top Bar for Session */}
            <div
              style={{
                background: "var(--bg-secondary)",
                padding: "0.75rem 1rem",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                Assigned Librarian:{" "}
                <span style={{ color: "var(--accent-blue)" }}>
                  {session.librarianId?.name || "Waiting for librarian..."}
                </span>
              </div>
              <button className="btn btn-sm btn-secondary" onClick={endSession}>
                End Chat
              </button>
            </div>

            {/* Messages */}
            <div
              className="chat-messages"
              style={{ flex: 1, padding: "1.5rem", overflowY: "auto" }}
            >
              {messages.map((msg) => {
                const isMine =
                  msg.senderRole === "student" && msg.sender === user?._id;
                const isSystem = msg.senderRole === "system";
                return (
                  <div
                    key={msg._id || msg.id}
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
                        {msg.senderRole === "admin" ||
                        msg.senderRole === "librarian"
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
          </>
        )}
      </div>
    </div>
  );
};

export default LiveChatPage;
