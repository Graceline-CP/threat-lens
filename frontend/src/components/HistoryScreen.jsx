const C = {
  bg: "#04080F", surface: "#0D1117", surfaceAlt: "#161B22", border: "#21262D",
  accent: "#00D9FF", safe: "#10B981", warn: "#F59E0B", danger: "#EF4444",
  text: "#E6EDF3", muted: "#7D8590",
};

const RISK_COLORS = {
  "Safe": C.safe,
  "Suspicious": C.warn,
  "High Risk": C.danger,
};

const TYPE_ICONS = { url: "🔗", text: "📄", image: "🖼" };

function RiskBadge({ classification, score }) {
  const color = RISK_COLORS[classification] || C.muted;
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}55`,
      borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 700,
      letterSpacing: 0.5, whiteSpace: "nowrap",
    }}>
      {score}/100 · {classification}
    </span>
  );
}

export function HistoryScreen({ history, onReview, onClear, onBack }) {
  const fmt = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
      + " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };

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
        <button
          onClick={onBack}
          style={{
            background: "transparent", color: C.accent, border: `1px solid ${C.accent}`,
            borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer", fontWeight: 600,
          }}
        >← Back</button>
      </nav>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
          <div>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: C.accent, letterSpacing: 2, marginBottom: 6 }}>
              SCAN HISTORY
            </p>
            <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1 }}>
              Past Analyses
            </h1>
          </div>
          {history.length > 0 && (
            <button
              onClick={onClear}
              style={{
                background: "transparent", color: C.muted, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer",
              }}
            >
              Clear All
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 16, padding: "60px 24px", textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p style={{ color: C.muted, fontSize: 15 }}>No scans yet. Run your first analysis to see results here.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => onReview(item)}
                style={{
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 12, padding: "18px 20px",
                  display: "flex", alignItems: "center", gap: 16,
                  cursor: "pointer", transition: "all 0.2s", flexWrap: "wrap",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = C.accent;
                  e.currentTarget.style.background = C.surfaceAlt;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.background = C.surface;
                }}
              >
                <span style={{ fontSize: 24 }}>{TYPE_ICONS[item.analysis_type] || "🔍"}</span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 500,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    marginBottom: 4,
                  }}>
                    {item.input}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted }}>
                    {fmt(item.scanned_at)} · {item.analysis_type?.toUpperCase()}
                  </div>
                </div>

                <RiskBadge classification={item.classification} score={item.risk_score} />

                <span style={{ color: C.muted, fontSize: 18 }}>›</span>
              </div>
            ))}
          </div>
        )}

        {/* Summary stats */}
        {history.length > 0 && (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12,
            marginTop: 32,
          }}>
            {[
              { label: "Total Scans", value: history.length },
              { label: "High Risk Found", value: history.filter(h => h.classification === "High Risk").length, color: C.danger },
              { label: "Safe", value: history.filter(h => h.classification === "Safe").length, color: C.safe },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 12, padding: "20px 16px", textAlign: "center",
              }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: color || C.text, marginBottom: 4 }}>
                  {value}
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}