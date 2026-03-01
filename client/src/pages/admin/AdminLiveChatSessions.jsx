import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

const formatTime = (d) =>
  new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const AdminLiveChatSessions = () => {
  const { user, login } = useAuth();
  const headers = { Authorization: `Bearer ${user?.token}` };

  const [chatAvailable, setChatAvailable] = useState(
    user?.chatAvailable || false,
  );
  const [toggling, setToggling] = useState(false);

  const [activeSessions, setActiveSessions] = useState([]);
  const [queuedSessions, setQueuedSessions] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null); // The Currently selected room to view

  const [messages, setMessages] = useState({}); // { roomId: [...] }
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  // Poll for sessions status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await axios.get("/api/chat/status", { headers });
      setActiveSessions(res.data.activeSessions || []);
      setQueuedSessions(res.data.queuedSessions || []);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // refresh list every 5s
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Handle Socket.io Connection
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current.on("connect", () => setConnected(true));
    socketRef.current.on("disconnect", () => setConnected(false));

    socketRef.current.on("receive_message", (data) => {
      if (data.socketId !== socketRef.current.id) {
        setMessages((prev) => ({
          ...prev,
          [data.roomId]: [...(prev[data.roomId] || []), data],
        }));
      }
    });

    socketRef.current.on("session_ended", (data) => {
      // Refresh list immediately if any session closed automatically
      fetchStatus();
    });

    return () => socketRef.current?.disconnect();
  }, [fetchStatus]);

  // Join rooms dynamically when activeSessions change so we can listen to their messages
  useEffect(() => {
    activeSessions.forEach((session) => {
      socketRef.current?.emit("join_room", session.roomId);
    });
  }, [activeSessions]);

  // Auto-scroll when viewing an active room
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeRoom]);

  // Fetch history for selected room
  const loadRoomHistory = async (roomId) => {
    try {
      const res = await axios.get(`/api/chat/history/${roomId}`, { headers });
      setMessages((prev) => ({
        ...prev,
        [roomId]: res.data,
      }));
    } catch (err) {
      console.error("Failed to fetch room history", err);
    }
  };

  const selectRoom = (roomId) => {
    setActiveRoom(roomId);
    if (!messages[roomId]) {
      loadRoomHistory(roomId);
    }
  };

  const toggleAvailability = async () => {
    setToggling(true);
    try {
      const res = await axios.put(
        "/api/chat/availability",
        { chatAvailable: !chatAvailable },
        { headers },
      );
      setChatAvailable(res.data.chatAvailable);
      // Update local storage via context if it keeps user cache
      login({
        ...user,
        chatAvailable: res.data.chatAvailable,
        token: user.token,
      });
    } catch (err) {
      alert("Failed to toggle availability.");
    }
    setToggling(false);
  };

  const joinQueuedSession = async (sessionId) => {
    try {
      await axios.put(`/api/chat/session/${sessionId}/join`, {}, { headers });
      fetchStatus();
    } catch (err) {
      alert("Failed to join session.");
    }
  };

  const endSession = async (sessionId) => {
    try {
      await axios.put(`/api/chat/session/${sessionId}/end`, {}, { headers });
      if (
        activeSessions.find((s) => s._id === sessionId)?.roomId === activeRoom
      ) {
        setActiveRoom(null);
      }
      fetchStatus();
    } catch (err) {
      alert("Failed to end session.");
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeRoom) return;
    try {
      const msgData = { content: input.trim(), roomId: activeRoom };

      const res = await axios.post("/api/chat/message", msgData, { headers });

      // Update local and broadcast
      const msgObj = {
        ...res.data,
        socketId: socketRef.current.id,
      };

      setMessages((prev) => ({
        ...prev,
        [activeRoom]: [...(prev[activeRoom] || []), msgObj],
      }));
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
    <div
      className="page-container"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        padding: "1.5rem",
        maxWidth: 1400,
      }}
    >
      {/* Header */}
      <div
        className="page-header"
        style={{ flexShrink: 0, marginBottom: "1rem" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1 className="page-title">Live Chat Sessions</h1>
            <div
              style={{
                height: 3,
                width: 60,
                background: "var(--accent-blue)",
                margin: "0.5rem 0",
              }}
            />
            <p className="page-subtitle">
              Monitor and respond to active student live chat sessions.
            </p>
          </div>

          {user?.role === "librarian" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                background: "var(--bg-card)",
                padding: "1rem",
                borderRadius: "12px",
                border: "1px solid var(--border)",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  My Status
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: chatAvailable ? "#4ade80" : "#f87171",
                  }}
                >
                  {chatAvailable
                    ? "🟢 Accepting Chats"
                    : "🔴 Not accepting chats"}
                </div>
              </div>
              <button
                onClick={toggleAvailability}
                disabled={toggling}
                style={{
                  width: 58,
                  height: 32,
                  borderRadius: 16,
                  border: "none",
                  cursor: toggling ? "wait" : "pointer",
                  background: chatAvailable
                    ? "var(--accent-blue)"
                    : "rgba(239,68,68,0.3)",
                  position: "relative",
                  transition: "background 0.25s",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 3,
                    left: chatAvailable ? 29 : 3,
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "#fff",
                    transition: "left 0.25s",
                    display: "block",
                  }}
                />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main interface split */}
      <div style={{ display: "flex", gap: "1.5rem", flex: 1, minHeight: 0 }}>
        {/* Left Sidebar - Queued & Active */}
        <div
          style={{
            width: "320px",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            flexShrink: 0,
          }}
        >
          {/* Queued */}
          <div
            className="card"
            style={{
              padding: "1rem",
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h3
              style={{
                fontSize: "0.9rem",
                color: "var(--text-primary)",
                marginBottom: "0.75rem",
              }}
            >
              Incoming Requests ({queuedSessions.length})
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {queuedSessions.length === 0 ? (
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    textAlign: "center",
                    padding: "1rem 0",
                  }}
                >
                  No incoming chats.
                </div>
              ) : (
                queuedSessions.map((s) => (
                  <div
                    key={s._id}
                    style={{
                      padding: "0.75rem",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      background: "var(--bg-secondary)",
                    }}
                  >
                    <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                      {s.studentId?.name || "Student"}
                    </div>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--text-muted)",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Requested: {formatTime(s.startTime)}
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ width: "100%" }}
                      onClick={() => joinQueuedSession(s._id)}
                    >
                      Accept request
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active */}
          <div
            className="card"
            style={{
              padding: "1rem",
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <h3
              style={{
                fontSize: "0.9rem",
                color: "var(--text-primary)",
                marginBottom: "0.75rem",
                color: "#4ade80",
              }}
            >
              My Active Sessions ({activeSessions.length})
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {activeSessions.length === 0 ? (
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    textAlign: "center",
                    padding: "1rem 0",
                  }}
                >
                  No active chats.
                </div>
              ) : (
                activeSessions.map((s) => (
                  <div
                    key={s._id}
                    onClick={() => selectRoom(s.roomId)}
                    style={{
                      padding: "0.75rem",
                      border: `1px solid ${activeRoom === s.roomId ? "var(--accent-blue)" : "var(--border)"}`,
                      borderRadius: "8px",
                      background:
                        activeRoom === s.roomId
                          ? "rgba(59,130,246,0.1)"
                          : "var(--bg-secondary)",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          color:
                            activeRoom === s.roomId
                              ? "var(--accent-blue)"
                              : "var(--text-primary)",
                        }}
                      >
                        {s.studentId?.name || "Student"}
                      </div>
                      <div
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        Started: {formatTime(s.startTime)}
                      </div>
                    </div>
                    {activeRoom === s.roomId && (
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          background: "var(--accent-blue)",
                          borderRadius: "50%",
                        }}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Pane - Chat Interface */}
        <div
          className="card"
          style={{
            flex: 1,
            padding: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {!activeRoom ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
                color: "var(--text-muted)",
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>💬</div>
              <div>Select an active session to start chatting</div>
            </div>
          ) : (
            <>
              {/* Active Room Header */}
              <div
                style={{
                  padding: "1rem 1.5rem",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "var(--bg-secondary)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                    {activeSessions.find((s) => s.roomId === activeRoom)
                      ?.studentId?.name || "Student"}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#4ade80",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        background: "#4ade80",
                        borderRadius: "50%",
                      }}
                    />{" "}
                    Live
                  </div>
                </div>
                <button
                  className="btn btn-sm"
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    color: "#ef4444",
                    border: "1px solid rgba(239,68,68,0.3)",
                  }}
                  onClick={() =>
                    endSession(
                      activeSessions.find((s) => s.roomId === activeRoom)?._id,
                    )
                  }
                >
                  End Session
                </button>
              </div>

              {/* Chat Messages */}
              <div
                className="chat-messages"
                style={{ flex: 1, padding: "1.5rem", overflowY: "auto" }}
              >
                {(messages[activeRoom] || []).map((msg) => {
                  const isMine =
                    msg.senderRole === user?.role && msg.sender === user?._id;
                  return (
                    <div
                      key={msg._id || msg.id}
                      className={`chat-message ${isMine ? "user" : "bot"}`}
                    >
                      {!isMine && (
                        <div
                          style={{
                            fontSize: "0.7rem",
                            color: "var(--text-muted)",
                            marginBottom: "0.2rem",
                            paddingLeft: "0.25rem",
                          }}
                        >
                          {msg.senderName}
                        </div>
                      )}
                      <div className="chat-bubble">{msg.content}</div>
                      <div className="chat-time">
                        {formatTime(msg.createdAt)}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input Area */}
              <div
                style={{
                  padding: "1rem 1.5rem",
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  gap: "0.75rem",
                  background: "var(--bg-secondary)",
                }}
              >
                <input
                  className="form-input"
                  style={{ flex: 1 }}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Type a message..."
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
    </div>
  );
};

export default AdminLiveChatSessions;
