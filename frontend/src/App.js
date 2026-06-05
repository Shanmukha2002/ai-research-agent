import { useState, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

const API = "https://ai-research-agent-ptrm.onrender.com/api";
function App() {
  const [query, setQuery] = useState("");
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await axios.get(`${API}/sessions`);
      setSessions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const startResearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      await axios.post(`${API}/research`, { query });
      setQuery("");
      setTimeout(fetchSessions, 3000);
    } catch (err) {
      alert("Error starting research. Is the server running?");
    }
    setLoading(false);
  };

  const fetchSession = async (id) => {
    try {
      const res = await axios.get(`${API}/sessions/${id}`);
      setSelected(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSession = async (id) => {
    try {
      await axios.delete(`${API}/sessions/${id}`);
      setSessions(sessions.filter((s) => s.id !== id));
      if (selected && selected.id === id) setSelected(null);
    } catch (err) {
      console.error(err);
    }
  };

  const statusColor = (status) => {
    if (status === "completed") return "#10b981";
    if (status === "running") return "#f59e0b";
    if (status === "failed") return "#ef4444";
    return "#94a3b8";
  };

  const statusBg = (status) => {
    if (status === "completed") return "#064e3b";
    if (status === "running") return "#451a03";
    if (status === "failed") return "#450a0a";
    return "#1e293b";
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0f172a",
      color: "#e2e8f0",
      fontFamily: "'Segoe UI', sans-serif"
    }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1e1b4b, #312e81)",
        padding: "32px 40px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #312e81"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 32 }}>🤖</span>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: "#fff" }}>
            AI Research Agent
          </h1>
        </div>

        {/* Search Box */}
        <div style={{ display: "flex", gap: 10, flex: 1, maxWidth: 600, marginLeft: 40 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && startResearch()}
            placeholder="Enter any research topic..."
            style={{
              flex: 1, padding: "12px 18px", fontSize: 15,
              border: "2px solid #4338ca", borderRadius: 10,
              background: "#1e1b4b", color: "#fff", outline: "none"
            }}
          />
          <button
            onClick={startResearch}
            disabled={loading}
            style={{
              padding: "12px 24px", fontSize: 15, fontWeight: 700,
              background: loading ? "#4338ca" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "white", border: "none", borderRadius: 10,
              cursor: loading ? "not-allowed" : "pointer",
              whiteSpace: "nowrap"
            }}
          >
            {loading ? "⏳" : "🔍 Research"}
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div style={{ display: "flex", height: "calc(100vh - 89px)" }}>

        {/* Left Panel - Sessions */}
        <div style={{
          width: 280, flexShrink: 0,
          background: "#0f172a",
          borderRight: "1px solid #1e293b",
          overflowY: "auto", padding: 16
        }}>
          <p style={{
            fontSize: 12, fontWeight: 600, color: "#475569",
            textTransform: "uppercase", letterSpacing: 1, marginBottom: 12
          }}>
            History ({sessions.length})
          </p>

          {sessions.length === 0 && (
            <div style={{ padding: 20, textAlign: "center", color: "#334155", fontSize: 13 }}>
              No research yet
            </div>
          )}

          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => fetchSession(s.id)}
              style={{
                padding: "12px 14px", marginBottom: 8, borderRadius: 10,
                border: selected?.id === s.id ? "1px solid #6366f1" : "1px solid #1e293b",
                cursor: "pointer",
                background: selected?.id === s.id ? "#1e1b4b" : "#1e293b",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 8px",
                  borderRadius: 20, background: statusBg(s.status),
                  color: statusColor(s.status), border: `1px solid ${statusColor(s.status)}33`
                }}>
                  {s.status === "running" ? "⏳" : s.status === "completed" ? "✅" : "❌"}
                  {" "}{s.status.toUpperCase()}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                  style={{
                    background: "none", border: "none",
                    cursor: "pointer", color: "#334155", fontSize: 16
                  }}
                >×</button>
              </div>
              <p style={{
                margin: "8px 0 4px", fontWeight: 600,
                fontSize: 13, color: "#e2e8f0",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
              }}>
                {s.query}
              </p>
              <p style={{ margin: 0, fontSize: 11, color: "#334155" }}>
                {new Date(s.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* Right Panel - Report */}
        <div style={{ flex: 1, overflowY: "auto", padding: 32 }}>
          {!selected ? (
            <div style={{
              height: "100%", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", color: "#334155"
            }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🔬</div>
              <p style={{ fontSize: 20, fontWeight: 600 }}>Start a research topic</p>
              <p style={{ fontSize: 14, marginTop: 8 }}>
                Type any topic in the search bar above
              </p>
            </div>
          ) : (
            <div style={{ maxWidth: 800, margin: "0 auto" }}>
              {selected.status === "running" ? (
                <div style={{ textAlign: "center", padding: 80 }}>
                  <div style={{ fontSize: 56 }}>⏳</div>
                  <p style={{ color: "#f59e0b", fontSize: 20, marginTop: 16, fontWeight: 600 }}>
                    Researching...
                  </p>
                  <p style={{ color: "#475569", fontSize: 14, marginTop: 8 }}>
                    Agents are searching the web and compiling your report
                  </p>
                </div>
              ) : selected.status === "failed" ? (
                <div style={{ textAlign: "center", padding: 80 }}>
                  <div style={{ fontSize: 56 }}>❌</div>
                  <p style={{ color: "#ef4444", fontSize: 20, marginTop: 16 }}>
                    Research failed. Please try again.
                  </p>
                </div>
              ) : (
                <div style={{
                  background: "#1e293b", borderRadius: 16,
                  padding: 40, border: "1px solid #334155", lineHeight: 1.8
                }}>
                  <ReactMarkdown
                    components={{
                      h1: ({node, ...props}) => <h1 style={{ color: "#a5b4fc", borderBottom: "1px solid #334155", paddingBottom: 12 }} {...props} />,
                      h2: ({node, ...props}) => <h2 style={{ color: "#818cf8", marginTop: 28 }} {...props} />,
                      h3: ({node, ...props}) => <h3 style={{ color: "#6366f1" }} {...props} />,
                      p: ({node, ...props}) => <p style={{ color: "#cbd5e1", lineHeight: 1.8 }} {...props} />,
                      li: ({node, ...props}) => <li style={{ color: "#cbd5e1", marginBottom: 6 }} {...props} />,
                      strong: ({node, ...props}) => <strong style={{ color: "#e2e8f0" }} {...props} />,
                    }}
                  >
                    {selected.report || "No report yet."}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;