import { Component } from "react";

const C = {
  bg: "#04080F", surface: "#0D1117", border: "#21262D",
  accent: "#00D9FF", danger: "#EF4444", text: "#E6EDF3", muted: "#7D8590",
};

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("Threat Lens caught an error:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        minHeight: "100vh", background: C.bg, display: "flex",
        alignItems: "center", justifyContent: "center", padding: 24,
        fontFamily: "'DM Sans', sans-serif", color: C.text,
      }}>
        <div style={{
          background: C.surface, border: `1px solid ${C.danger}44`,
          borderRadius: 16, padding: "40px 36px", maxWidth: 500, width: "100%",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            An unexpected error occurred. Please refresh the page to continue.
          </p>
          <details style={{ textAlign: "left", marginBottom: 24 }}>
            <summary style={{ cursor: "pointer", fontSize: 13, color: C.muted }}>Error details</summary>
            <pre style={{
              marginTop: 10, padding: "12px", background: "#0D1117",
              borderRadius: 8, fontSize: 12, color: C.danger,
              overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>
              {this.state.error?.toString()}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: C.accent, color: C.bg, border: "none",
              borderRadius: 8, padding: "12px 28px", fontSize: 14,
              fontWeight: 700, cursor: "pointer",
            }}
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}