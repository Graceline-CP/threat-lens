const C = {
  bg: "#04080F", surface: "#0D1117", surfaceAlt: "#161B22", border: "#21262D",
  accent: "#00D9FF", safe: "#10B981", warn: "#F59E0B", danger: "#EF4444",
  text: "#E6EDF3", muted: "#7D8590",
};

const RISK_COLORS = { "Safe": C.safe, "Suspicious": C.warn, "High Risk": C.danger };
const TYPE_ICONS  = { url: "🔗", text: "📄", image: "🖼" };

function RiskBadge({ classification, score }) {
  const color = RISK_COLORS[classification] || C.muted;
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}55`,
      borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700,
      letterSpacing: 0.3, whiteSpace: "nowrap",
    }}>
      {score}/100 · {classification}
    </span>
  );
}

export function HistoryScreen({ history, loading, onReview, onClear, onBack }) {
  const fmt = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
      + " · " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };

  const stats = [
    { label: "Total Scans",    value: history.length,                                        color: C.text   },
    { label: "High Risk",      value: history.filter(h => h.classification === "High Risk").length, color: C.danger },
    { label: "Suspicious",     value: history.filter(h => h.classification === "Suspicious").length, color: C.warn  },
    { label: "Safe",           value: history.filter(h => h.classification === "Safe").length,       color: C.safe  },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Sans', sans-serif" }}>

      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 32px", borderBottom: `1px solid ${C.border}`,
        position: "sticky", top: 0, zIndex: 100,
        background: C.bg + "CC", backdropFilter: "blur(12px)",
      }}>
        <span style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 16, color: "#fff" }}>
          THREAT<span style={{ color: C.accent }}>LENS</span>
        </span>
        <button onClick={onBack} style={{
          background: "transparent", color: C.accent, border: `1px solid ${C.accent}`,
          borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 600,
        }}>← Back</button>
      </nav>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px" }}>

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
          <div>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: C.accent, letterSpacing: 2, marginBottom: 6 }}>
              SCAN HISTORY
            </p>
            <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1, margin: 0 }}>Past Analyses</h1>
          </div>
          {history.length > 0 && (
            <button onClick={onClear} style={{
              background: "transparent", color: C.muted, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer",
              transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.danger; e.currentTarget.style.color = C.danger; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
            >
              🗑 Clear All
            </button>
          )}
        </div>

        {/* Stats row */}
        {history.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
            {stats.map(({ label, value, color }) => (
              <div key={label} style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 12, padding: "16px", textAlign: "center",
              }}>
                <div style={{ fontSize: 26, fontWeight: 800, color, marginBottom: 4 }}>{value}</div>
                <div style={{ fontSize: 11, color: C.muted, fontFamily: "'Space Mono', monospace", letterSpacing: 0.5 }}>
                  {label.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 16, padding: "72px 24px", textAlign: "center",
          }}>
            <div style={{
              width: 40, height: 40, border: `3px solid ${C.border}`,
              borderTop: `3px solid ${C.accent}`, borderRadius: "50%",
              animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
            }} />
            <p style={{ color: C.muted, fontSize: 14 }}>Loading your scan history...</p>
          </div>
        ) : history.length === 0 ? (
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 16, padding: "72px 24px", textAlign: "center",
          }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🔍</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No scans yet</h3>
            <p style={{ color: C.muted, fontSize: 14 }}>
              Run your first analysis — results will appear here automatically.
            </p>
            <button onClick={onBack} style={{
              marginTop: 24, background: C.accent, color: C.bg, border: "none",
              borderRadius: 8, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer",
            }}>
              Start Scanning →
            </button>
          </div>
        ) : (
          /* History list */
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => onReview(item)}
                style={{
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 12, padding: "16px 20px",
                  display: "flex", alignItems: "center", gap: 14,
                  cursor: "pointer", transition: "all 0.2s", flexWrap: "wrap",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = C.accent;
                  e.currentTarget.style.background = C.surfaceAlt;
                  e.currentTarget.style.transform = "translateX(4px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.background = C.surface;
                  e.currentTarget.style.transform = "translateX(0)";
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: C.surfaceAlt, border: `1px solid ${C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
                }}>
                  {TYPE_ICONS[item.analysis_type] || "🔍"}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 500, color: C.text,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    marginBottom: 3,
                  }}>
                    {item.input}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted }}>
                    {fmt(item.scanned_at)}
                    <span style={{
                      marginLeft: 8, background: C.surfaceAlt, border: `1px solid ${C.border}`,
                      borderRadius: 4, padding: "1px 6px", fontSize: 10,
                      fontFamily: "'Space Mono', monospace", letterSpacing: 0.5,
                    }}>
                      {item.analysis_type?.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Badge */}
                <RiskBadge classification={item.classification} score={item.risk_score} />

                {/* Arrow */}
                <span style={{ color: C.muted, fontSize: 16, flexShrink: 0 }}>›</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}