import { useState, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

const API = "http://localhost:8000/api";

function App() {
  const [query, setQuery] = useState("");
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Load all sessions on startup
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
    setMessage("");
    try {
      await axios.post(`${API}/research`, { query });
      setMessage("Research started! Results will appear below in ~30 seconds.");
      setQuery("");
      setTimeout(fetchSessions, 3000);
    } catch (err) {
      setMessage("Error starting research. Is the server running?");
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
    if (status === "completed") return "#22c55e";
    if (status === "running") return "#f59e0b";
    if (status === "failed") return "#ef4444";
    return "#94a3b8";
  };

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 1100, margin: "0 auto", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
          AI Research Agent
        </h1>
        <p style={{ color: "#64748b", marginTop: 4 }}>
          Multi-agent system: Planner → Researcher → Writer
        </p>
      </div>

      {/* Search Box */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && startResearch()}
          placeholder="Enter a research topic..."
          style={{
            flex: 1, padding: "12px 16px", fontSize: 16,
            border: "1px solid #e2e8f0", borderRadius: 8, outline: "none"
          }}
        />
        <button
          onClick={startResearch}
          disabled={loading}
          style={{
            padding: "12px 28px", fontSize: 16, fontWeight: 600,
            background: loading ? "#94a3b8" : "#6366f1",
            color: "white", border: "none", borderRadius: 8, cursor: "pointer"
          }}
        >
          {loading ? "Starting..." : "Research"}
        </button>
      </div>

      {message && (
        <div style={{
          padding: "12px 16px", background: "#f0fdf4",
          border: "1px solid #86efac", borderRadius: 8, marginBottom: 16,
          color: "#166534"
        }}>
          {message}
        </div>
      )}

      {/* Main Layout */}
      <div style={{ display: "flex", gap: 24 }}>

        {/* Sessions List */}
        <div style={{ width: 320, flexShrink: 0 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
            Research Sessions ({sessions.length})
          </h2>
          {sessions.length === 0 && (
            <p style={{ color: "#94a3b8", fontSize: 14 }}>No sessions yet.</p>
          )}
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => fetchSession(s.id)}
              style={{
                padding: 12, marginBottom: 8, borderRadius: 8,
                border: selected?.id === s.id ? "2px solid #6366f1" : "1px solid #e2e8f0",
                cursor: "pointer", background: "white"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: "2px 8px",
                  borderRadius: 12, background: statusColor(s.status) + "22",
                  color: statusColor(s.status)
                }}>
                  {s.status.toUpperCase()}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#94a3b8", fontSize: 16
                  }}
                >
                  ×
                </button>
              </div>
              <p style={{ margin: "8px 0 4px", fontWeight: 500, fontSize: 14 }}>
                {s.query}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
                {new Date(s.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {/* Report View */}
        <div style={{ flex: 1 }}>
          {!selected ? (
            <div style={{
              padding: 40, textAlign: "center", color: "#94a3b8",
              border: "1px dashed #e2e8f0", borderRadius: 8
            }}>
              Click a session to view the report
            </div>
          ) : (
            <div>
              {/* Agent Steps */}
              {selected.steps && selected.steps.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
                    Agent Steps
                  </h3>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {selected.steps.map((step, i) => (
                      <div key={i} style={{
                        padding: "6px 12px", borderRadius: 6, fontSize: 12,
                        background: step.status === "success" ? "#f0fdf4" : "#fef2f2",
                        border: `1px solid ${step.status === "success" ? "#86efac" : "#fca5a5"}`,
                        color: step.status === "success" ? "#166534" : "#991b1b"
                      }}>
                        {step.agent_name} → {step.action}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sources */}
              {selected.sources && selected.sources.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
                    Sources ({selected.sources.length})
                  </h3>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {selected.sources.slice(0, 5).map((src, i) => (
                      <a key={i} href={src.url} target="_blank" rel="noreferrer"
                        style={{
                          padding: "4px 10px", borderRadius: 6, fontSize: 12,
                          background: "#f8fafc", border: "1px solid #e2e8f0",
                          color: "#6366f1", textDecoration: "none"
                        }}>
                        {src.title?.slice(0, 30) || "Source"}...
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Report */}
              <div style={{
                padding: 24, background: "white",
                border: "1px solid #e2e8f0", borderRadius: 8
              }}>
                {selected.status === "running" ? (
                  <p style={{ color: "#f59e0b" }}>Research in progress... please wait.</p>
                ) : selected.status === "failed" ? (
                  <p style={{ color: "#ef4444" }}>Research failed. Please try again.</p>
                ) : (
                  <ReactMarkdown>{selected.report || "No report yet."}</ReactMarkdown>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;