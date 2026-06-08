import { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

const API = "https://ai-research-agent-ptrm.onrender.com/api";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; }

  .session-card { transition: all 0.2s ease; }
  .session-card:hover { transform: translateX(4px); border-color: #6366f1 !important; }

  .research-btn { transition: all 0.2s ease; }
  .research-btn:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
  }

  .delete-btn { transition: all 0.2s ease; opacity: 0.4; }
  .delete-btn:hover { opacity: 1; color: #ef4444 !important; }

  .source-link { transition: all 0.2s ease; }
  .source-link:hover { background: #312e81 !important; transform: translateY(-2px); }

  .report-card { animation: fadeIn 0.5s ease; }
  .translate-btn { transition: all 0.2s ease; }
  .translate-btn:hover { transform: scale(1.05); }

  .tag { transition: all 0.2s ease; }
  .tag:hover { transform: scale(1.05); background: #1e293b !important; }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  @keyframes gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  .animated-bg {
    background: linear-gradient(-45deg, #1e1b4b, #312e81, #1e1b4b, #2d1b69);
    background-size: 400% 400%;
    animation: gradient 8s ease infinite;
  }

  .input-field { transition: all 0.2s ease; }
  .input-field:focus {
    border-color: #818cf8 !important;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
  }

  .spinner {
    width: 40px; height: 40px;
    border: 4px solid #1e293b;
    border-top: 4px solid #6366f1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto;
  }

  .pulse-dot { animation: pulse 1.5s ease infinite; }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #0f172a; }
  ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #334155; }

  .empty-state { animation: fadeIn 0.5s ease; }
`;

function App() {
  const [query, setQuery] = useState("");
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [translatedReport, setTranslatedReport] = useState("");
  const [translating, setTranslating] = useState(false);
  const [reportLanguage, setReportLanguage] = useState("English");
  const inputRef = useRef(null);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selected?.status === "running") {
      const interval = setInterval(() => fetchSession(selected.id), 4000);
      return () => clearInterval(interval);
    }
  }, [selected]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const fetchSessions = async () => {
    try {
      const res = await axios.get(`${API}/sessions`);
      setSessions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const startResearch = async () => {
    if (!query.trim()) {
      inputRef.current?.focus();
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/research`, { query });
      showToast("✅ Research started! Results in ~30 seconds.");
      setQuery("");
      setTimeout(fetchSessions, 2000);
    } catch (err) {
      showToast("❌ Error starting research. Is the server running?");
    }
    setLoading(false);
  };

  const fetchSession = async (id) => {
    try {
      const res = await axios.get(`${API}/sessions/${id}`);
      setSelected(res.data);
      setTranslatedReport("");
      setReportLanguage("English");
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSession = async (id) => {
    try {
      await axios.delete(`${API}/sessions/${id}`);
      setSessions(sessions.filter((s) => s.id !== id));
      if (selected && selected.id === id) setSelected(null);
      showToast("🗑️ Session deleted");
    } catch (err) {
      console.error(err);
    }
  };

  const translateReport = async (lang) => {
    if (reportLanguage === lang) return;
    setTranslating(true);
    setReportLanguage(lang);
    try {
      const res = await axios.post(`${API}/translate`, {
        report: selected.report,
        language: lang
      });
      setTranslatedReport(res.data.translated_report);
    } catch (err) {
      showToast("❌ Translation failed");
    }
    setTranslating(false);
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
    <>
      <style>{styles}</style>
      <div style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#e2e8f0",
        fontFamily: "'Inter', sans-serif"
      }}>

        {/* Toast */}
        {toast && (
          <div style={{
            position: "fixed", top: 20, right: 20, zIndex: 1000,
            padding: "12px 20px", borderRadius: 10,
            background: "#1e293b", border: "1px solid #334155",
            color: "#e2e8f0", fontSize: 14, fontWeight: 500,
            boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
            animation: "fadeIn 0.3s ease"
          }}>
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="animated-bg" style={{
          padding: "18px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(99,102,241,0.3)",
          flexWrap: "wrap",
          gap: 16
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <span style={{ fontSize: 26 }}>🤖</span>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: "#fff" }}>
                AI Research Agent
              </h1>
              <p style={{ fontSize: 11, color: "#a5b4fc", margin: 0 }}>
                Powered by LangGraph + Groq
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flex: 1, maxWidth: 680, minWidth: 280 }}>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startResearch()}
              placeholder="Enter any research topic..."
              className="input-field"
              style={{
                flex: 1, padding: "10px 16px", fontSize: 14,
                border: "2px solid rgba(99,102,241,0.5)", borderRadius: 10,
                background: "rgba(30,27,75,0.8)", color: "#fff", outline: "none"
              }}
            />
            <button
              onClick={startResearch}
              disabled={loading}
              className="research-btn"
              style={{
                padding: "10px 20px", fontSize: 14, fontWeight: 700,
                background: loading ? "#4338ca" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "white", border: "none", borderRadius: 10,
                cursor: loading ? "not-allowed" : "pointer",
                whiteSpace: "nowrap", flexShrink: 0
              }}
            >
              {loading ? "⏳" : "🔍 Research"}
            </button>
          </div>
        </div>

        {/* Main Layout */}
        <div style={{ display: "flex", height: "calc(100vh - 73px)" }}>

          {/* Left Panel */}
          <div style={{
            width: 270, flexShrink: 0,
            background: "#0a0f1e",
            borderRight: "1px solid #1e293b",
            overflowY: "auto", padding: 16,
            display: "flex", flexDirection: "column", gap: 4
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 12
            }}>
              <p style={{
                fontSize: 11, fontWeight: 600, color: "#475569",
                textTransform: "uppercase", letterSpacing: 1, margin: 0
              }}>
                History
              </p>
              <span style={{
                fontSize: 11, padding: "2px 8px", borderRadius: 20,
                background: "#1e293b", color: "#6366f1", fontWeight: 700
              }}>
                {sessions.length}
              </span>
            </div>

            {sessions.length === 0 && (
              <div className="empty-state" style={{
                padding: 24, textAlign: "center", color: "#334155",
                fontSize: 13, border: "1px dashed #1e293b", borderRadius: 10
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                No research yet
              </div>
            )}

            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => fetchSession(s.id)}
                className="session-card"
                style={{
                  padding: "12px 14px", borderRadius: 10,
                  border: selected?.id === s.id ? "1px solid #6366f1" : "1px solid #1e293b",
                  cursor: "pointer",
                  background: selected?.id === s.id ? "#1e1b4b" : "#111827",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "2px 8px",
                    borderRadius: 20, background: statusBg(s.status),
                    color: statusColor(s.status)
                  }}>
                    {s.status === "running" && <span className="pulse-dot">⏳ </span>}
                    {s.status === "completed" && "✅ "}
                    {s.status === "failed" && "❌ "}
                    {s.status.toUpperCase()}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                    className="delete-btn"
                    style={{
                      background: "none", border: "none",
                      cursor: "pointer", color: "#475569", fontSize: 16
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

          {/* Right Panel */}
          <div style={{ flex: 1, overflowY: "auto", padding: 32 }}>
            {!selected ? (
              <div className="empty-state" style={{
                height: "100%", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", color: "#334155"
              }}>
                <div style={{ fontSize: 72, marginBottom: 20 }}>🔬</div>
                <p style={{ fontSize: 22, fontWeight: 700, color: "#475569" }}>
                  Start Researching
                </p>
                <p style={{ fontSize: 14, marginTop: 8, color: "#334155" }}>
                  Type any topic above and click Research
                </p>
                <div style={{
                  display: "flex", gap: 10, marginTop: 24,
                  flexWrap: "wrap", justifyContent: "center"
                }}>
                  {["AI in Healthcare", "Climate Change", "Quantum Computing", "Electric Vehicles"].map((t) => (
                    <span
                      key={t}
                      className="tag"
                      onClick={() => setQuery(t)}
                      style={{
                        padding: "6px 14px", borderRadius: 20, fontSize: 12,
                        background: "#111827", border: "1px solid #334155",
                        color: "#6366f1", cursor: "pointer", fontWeight: 500
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="report-card" style={{ maxWidth: 800, margin: "0 auto" }}>

                {selected.status === "running" ? (
                  <div style={{ textAlign: "center", padding: 80 }}>
                    <div className="spinner" style={{ marginBottom: 24 }} />
                    <p style={{ color: "#f59e0b", fontSize: 20, fontWeight: 700 }}>
                      Researching...
                    </p>
                    <p style={{ color: "#475569", fontSize: 14, marginTop: 8 }}>
                      Agents are searching the web and compiling your report
                    </p>
                    <div style={{
                      display: "flex", gap: 8, justifyContent: "center", marginTop: 24
                    }}>
                      {["🧠 Planning", "🔍 Researching", "✍️ Writing"].map((step, i) => (
                        <span key={i} className="pulse-dot" style={{
                          padding: "6px 14px", borderRadius: 20, fontSize: 12,
                          background: "#1e293b", border: "1px solid #334155",
                          color: "#a5b4fc", animationDelay: `${i * 0.3}s`
                        }}>
                          {step}
                        </span>
                      ))}
                    </div>
                  </div>

                ) : selected.status === "failed" ? (
                  <div style={{ textAlign: "center", padding: 80 }}>
                    <div style={{ fontSize: 56 }}>❌</div>
                    <p style={{ color: "#ef4444", fontSize: 20, marginTop: 16, fontWeight: 600 }}>
                      Research failed. Please try again.
                    </p>
                  </div>

                ) : (
                  <div>
                    {/* Sources */}
                    {selected.sources?.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <p style={{
                          fontSize: 11, fontWeight: 600, color: "#475569",
                          textTransform: "uppercase", letterSpacing: 1, marginBottom: 10
                        }}>
                          {selected.sources.length} Sources
                        </p>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {selected.sources.slice(0, 5).map((src, i) => (
                            <a key={i} href={src.url} target="_blank" rel="noreferrer"
                              className="source-link"
                              style={{
                                padding: "5px 12px", borderRadius: 20, fontSize: 12,
                                background: "#1e293b", border: "1px solid #334155",
                                color: "#a5b4fc", textDecoration: "none"
                              }}>
                              🔗 {src.title?.slice(0, 25) || "Source"}...
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Translate Buttons */}
                    <div style={{
                      display: "flex", gap: 10, marginBottom: 20,
                      alignItems: "center", flexWrap: "wrap"
                    }}>
                      <p style={{
                        fontSize: 11, fontWeight: 600, color: "#475569",
                        textTransform: "uppercase", letterSpacing: 1, margin: 0
                      }}>
                        Translate:
                      </p>
                      {["English", "Hindi", "Kannada"].map((lang) => (
                        <button
                          key={lang}
                          onClick={() => translateReport(lang)}
                          className="translate-btn"
                          style={{
                            padding: "6px 16px", fontSize: 12, fontWeight: 600,
                            background: reportLanguage === lang
                              ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                              : "#1e293b",
                            color: reportLanguage === lang ? "#fff" : "#a5b4fc",
                            border: "1px solid #334155", borderRadius: 20,
                            cursor: "pointer"
                          }}
                        >
                          {lang === "English" ? "🇬🇧" : "🇮🇳"} {lang}
                        </button>
                      ))}
                      {translating && (
                        <span style={{ color: "#f59e0b", fontSize: 12 }}>
                          ⏳ Translating...
                        </span>
                      )}
                    </div>

                    {/* Report */}
                    <div style={{
                      background: "#111827", borderRadius: 16,
                      padding: 40, border: "1px solid #1e293b", lineHeight: 1.8
                    }}>
                      <ReactMarkdown
                        components={{
                          h1: ({ node, ...props }) => <h1 style={{ color: "#a5b4fc", borderBottom: "1px solid #1e293b", paddingBottom: 12, marginBottom: 20 }} {...props} />,
                          h2: ({ node, ...props }) => <h2 style={{ color: "#818cf8", marginTop: 28, marginBottom: 12 }} {...props} />,
                          h3: ({ node, ...props }) => <h3 style={{ color: "#6366f1", marginTop: 20, marginBottom: 8 }} {...props} />,
                          p: ({ node, ...props }) => <p style={{ color: "#cbd5e1", lineHeight: 1.8, marginBottom: 14 }} {...props} />,
                          li: ({ node, ...props }) => <li style={{ color: "#cbd5e1", marginBottom: 6 }} {...props} />,
                          strong: ({ node, ...props }) => <strong style={{ color: "#e2e8f0" }} {...props} />,
                          ul: ({ node, ...props }) => <ul style={{ paddingLeft: 20, marginBottom: 14 }} {...props} />,
                        }}
                      >
                        {translatedReport || selected.report || "No report yet."}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;