import { useState, useEffect, useRef } from "react";
import { auth, googleProvider } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { useScanHistory } from "./hooks/useScanHistory";
import { HistoryScreen } from "./components/HistoryScreen";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

// ─── DESIGN TOKENS ──────────────────────────────────────────────────────────
const C = {
  bg: "#04080F",
  surface: "#0D1117",
  surfaceAlt: "#161B22",
  border: "#21262D",
  accent: "#00D9FF",
  accentDim: "#00D9FF22",
  accentGlow: "#00D9FF44",
  safe: "#10B981",
  warn: "#F59E0B",
  danger: "#EF4444",
  text: "#E6EDF3",
  muted: "#7D8590",
  white: "#FFFFFF",
};

// ─── GLOBAL STYLES ──────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: ${C.bg};
      color: ${C.text};
      font-family: 'DM Sans', sans-serif;
      min-height: 100vh;
      overflow-x: hidden;
    }

    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: ${C.bg}; }
    ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }

    ::selection { background: ${C.accentGlow}; color: ${C.accent}; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes scanline {
      0% { top: -2px; }
      100% { top: 100%; }
    }
    @keyframes flicker {
      0%, 95%, 100% { opacity: 1; }
      96% { opacity: 0.8; }
      97% { opacity: 1; }
      98% { opacity: 0.9; }
    }
    @keyframes gridScroll {
      0% { background-position: 0 0; }
      100% { background-position: 0 60px; }
    }
    @keyframes borderGlow {
      0%, 100% { border-color: ${C.accentGlow}; box-shadow: 0 0 10px ${C.accentGlow}; }
      50% { border-color: ${C.accent}; box-shadow: 0 0 20px ${C.accent}44; }
    }
    @keyframes scoreCount {
      from { opacity: 0; transform: scale(0.5); }
      to { opacity: 1; transform: scale(1); }
    }

    .fade-up { animation: fadeUp 0.5s ease forwards; }
    .fade-up-2 { animation: fadeUp 0.5s ease 0.1s both; }
    .fade-up-3 { animation: fadeUp 0.5s ease 0.2s both; }
    .fade-up-4 { animation: fadeUp 0.5s ease 0.3s both; }

    input, textarea {
      outline: none;
      font-family: 'DM Sans', sans-serif;
    }

    button { cursor: pointer; font-family: 'DM Sans', sans-serif; }

    .mono { font-family: 'Space Mono', monospace; }
  `}</style>
);

// ─── COMPONENTS ─────────────────────────────────────────────────────────────

const GridBg = () => (
  <div style={{
    position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
    backgroundImage: `
      linear-gradient(${C.border}44 1px, transparent 1px),
      linear-gradient(90deg, ${C.border}44 1px, transparent 1px)
    `,
    backgroundSize: "60px 60px",
    animation: "gridScroll 8s linear infinite",
    maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)"
  }} />
);

const Logo = ({ size = 28 }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <div style={{
      width: size, height: size,
      border: `2px solid ${C.accent}`,
      borderRadius: 4,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: `0 0 12px ${C.accentGlow}`,
      animation: "borderGlow 3s ease-in-out infinite",
      flexShrink: 0
    }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="3" stroke={C.accent} strokeWidth="1.5" />
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M3.5 3.5l1.5 1.5M11 11l1.5 1.5M3.5 12.5l1.5-1.5M11 5l1.5-1.5"
          stroke={C.accent} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      </svg>
    </div>
    <span className="mono" style={{ fontSize: size * 0.65, fontWeight: 700, color: C.white, letterSpacing: 1 }}>
      THREAT<span style={{ color: C.accent }}>LENS</span>
    </span>
  </div>
);

const Btn = ({ children, onClick, variant = "primary", style: s = {}, disabled = false, loading = false }) => {
  const styles = {
    primary: {
      background: C.accent, color: C.bg, border: "none",
      fontWeight: 700, letterSpacing: 0.5
    },
    ghost: {
      background: "transparent", color: C.accent,
      border: `1px solid ${C.accent}`, fontWeight: 600
    },
    danger: {
      background: C.danger, color: C.white, border: "none", fontWeight: 700
    },
    muted: {
      background: C.surfaceAlt, color: C.text,
      border: `1px solid ${C.border}`, fontWeight: 500
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        padding: "12px 24px", borderRadius: 8, fontSize: 14,
        display: "inline-flex", alignItems: "center", gap: 8,
        transition: "all 0.2s", opacity: disabled ? 0.5 : 1,
        ...styles[variant], ...s
      }}
    >
      {loading ? <span style={{ animation: "spin 0.8s linear infinite", display: "inline-block" }}>◌</span> : children}
    </button>
  );
};

const Input = ({ label, type = "text", value, onChange, placeholder, rows }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    {label && <label className="mono" style={{ fontSize: 11, color: C.muted, letterSpacing: 1, textTransform: "uppercase" }}>{label}</label>}
    {rows ? (
      <textarea
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 8, padding: "12px 16px", color: C.text,
          fontSize: 14, lineHeight: 1.6, resize: "vertical",
          transition: "border-color 0.2s",
          onFocus: `this.style.borderColor='${C.accent}'`
        }}
        onFocus={e => e.target.style.borderColor = C.accent}
        onBlur={e => e.target.style.borderColor = C.border}
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 8, padding: "12px 16px", color: C.text,
          fontSize: 14, transition: "border-color 0.2s"
        }}
        onFocus={e => e.target.style.borderColor = C.accent}
        onBlur={e => e.target.style.borderColor = C.border}
      />
    )}
  </div>
);

// ─── SCREEN: LANDING ────────────────────────────────────────────────────────
const LandingScreen = ({ onEnter }) => {
  const [showInfo, setShowInfo] = useState(false);

  return (
  <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", position: "relative" }}>
    <GridBg />

    {/* Learn More Modal */}
    {showInfo && (
      <div
        onClick={() => setShowInfo(false)}
        style={{
          position: "fixed", inset: 0, background: "#00000088",
          zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 20, padding: "40px 36px", maxWidth: 520, width: "100%",
            position: "relative"
          }}
        >
          <button
            onClick={() => setShowInfo(false)}
            style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: C.muted, fontSize: 20, cursor: "pointer" }}
          >✕</button>

          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>About Threat Lens</h2>
          <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
            Threat Lens is an AI-powered cybersecurity tool that analyzes URLs, text, and images to detect phishing attempts, scams, and malicious content.
          </p>

          {[
            ["🔗", "URL Scanner", "Checks links against phishing databases, runs WHOIS lookups, analyzes page content and suspicious patterns."],
            ["🖼", "Image Analysis", "Uses OCR to extract text from screenshots and CV models to detect spoofed brand logos and synthetic images."],
            ["📄", "Text Detection", "Runs NLP models and regex pattern matching to identify scam language, urgency tactics, and credential harvesting."],
            ["📋", "PDF Reports", "Every scan generates a downloadable threat report with risk score, detected issues, and red flag explanations."],
          ].map(([icon, title, desc]) => (
            <div key={title} style={{ display: "flex", gap: 14, marginBottom: 18 }}>
              <div style={{ fontSize: 22, flexShrink: 0 }}>{icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{title}</div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{desc}</div>
              </div>
            </div>
          ))}

          <Btn onClick={onEnter} style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
            Start Scanning →
          </Btn>
        </div>
      </div>
    )}

    <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 640 }}>
      <div className="fade-up" style={{ marginBottom: 32 }}>
        <Logo size={40} />
      </div>

      <h1 className="fade-up-2" style={{
        fontSize: "clamp(40px, 8vw, 72px)", fontWeight: 700, lineHeight: 1.05,
        letterSpacing: -2, color: C.white, marginBottom: 20
      }}>
        See Through<br />
        <span style={{ color: C.accent, fontStyle: "italic" }}>Every Threat</span>
      </h1>

      <p className="fade-up-3" style={{ fontSize: 17, color: C.muted, lineHeight: 1.7, marginBottom: 40, maxWidth: 480, margin: "0 auto 40px" }}>
        AI-powered analysis of URLs, text, and images to detect phishing, scams, and malicious content — in seconds.
      </p>

      <div className="fade-up-4" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Btn onClick={onEnter} style={{ padding: "14px 36px", fontSize: 15 }}>
          Start Scanning →
        </Btn>
        <Btn variant="ghost" onClick={() => setShowInfo(true)} style={{ padding: "14px 28px", fontSize: 15 }}>
          Learn More
        </Btn>
      </div>

      <div className="fade-up-4" style={{ display: "flex", gap: 32, justifyContent: "center", marginTop: 60 }}>
        {[["URL Analysis", "🔗"], ["Image Scan", "🖼"], ["Text Detection", "📄"]].map(([label, icon]) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
            <div className="mono" style={{ fontSize: 11, color: C.muted, letterSpacing: 1 }}>{label.toUpperCase()}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
  );
};

// ─── SCREEN: AUTH ────────────────────────────────────────────────────────────
const AuthScreen = ({ onAuth }) => {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async () => {
    setError(""); setLoading(true);
    try {
      if (mode === "signin") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onAuth();
    } catch (e) {
      setError(e.message.replace("Firebase: ", "").replace(/\(auth\/.*\)/, "").trim());
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError(""); setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      onAuth();
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative" }}>
      <GridBg />
      <div className="fade-up" style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 16, padding: "40px 36px", width: "100%", maxWidth: 420,
        position: "relative", zIndex: 1
      }}>
        <div style={{ marginBottom: 32 }}><Logo size={24} /></div>

        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>
          {mode === "signin" ? "Welcome back" : "Create account"}
        </h2>
        <p style={{ fontSize: 14, color: C.muted, marginBottom: 28 }}>
          {mode === "signin" ? "Sign in to continue scanning threats" : "Join Threat Lens for free"}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
          <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
        </div>

        {error && (
          <div style={{ background: "#EF444422", border: `1px solid ${C.danger}44`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: C.danger }}>
            {error}
          </div>
        )}

        <Btn onClick={handleEmailAuth} loading={loading} style={{ width: "100%", justifyContent: "center", marginBottom: 12 }}>
          {mode === "signin" ? "Sign In" : "Create Account"}
        </Btn>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <span style={{ fontSize: 12, color: C.muted }}>or</span>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>

        <Btn variant="muted" onClick={handleGoogle} style={{ width: "100%", justifyContent: "center", gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </Btn>

        <p style={{ textAlign: "center", fontSize: 13, color: C.muted, marginTop: 20 }}>
          {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
          <span style={{ color: C.accent, cursor: "pointer" }} onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
            {mode === "signin" ? "Sign up" : "Sign in"}
          </span>
        </p>
      </div>
    </div>
  );
};

// ─── SCREEN: HOME ────────────────────────────────────────────────────────────
const HomeScreen = ({ user, onSelect, onSignOut, onHistory }) => {
  const cards = [
    { type: "url", icon: "🔗", title: "URL Scanner", desc: "Paste any link to check for phishing, malware, or suspicious redirects." },
    { type: "image", icon: "🖼", title: "Image Analysis", desc: "Upload screenshots, QR codes, or images to detect hidden threats." },
    { type: "text", icon: "📄", title: "Text Detection", desc: "Paste emails, messages, or any text to identify scam patterns." },
  ];

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <GridBg />

      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 32px", borderBottom: `1px solid ${C.border}`,
        position: "sticky", top: 0, zIndex: 100,
        background: `${C.bg}CC`, backdropFilter: "blur(12px)"
      }}>
        <Logo size={22} />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: C.muted }}>{user?.email}</span>
          <Btn variant="muted" onClick={onHistory} style={{ padding: "8px 16px", fontSize: 13 }}>🕘 History</Btn>
          <Btn variant="ghost" onClick={onSignOut} style={{ padding: "8px 16px", fontSize: 13 }}>Sign Out</Btn>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "60px 24px", position: "relative", zIndex: 1 }}>
        <div className="fade-up" style={{ marginBottom: 48, textAlign: "center" }}>
          <p className="mono" style={{ fontSize: 11, color: C.accent, letterSpacing: 2, marginBottom: 12 }}>
            THREAT ANALYSIS SUITE
          </p>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 700, letterSpacing: -1.5, marginBottom: 12 }}>
            What would you like to scan?
          </h1>
          <p style={{ fontSize: 16, color: C.muted }}>
            Choose an analysis type to get started
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {cards.map((card, i) => (
            <div
              key={card.type}
              className={`fade-up-${i + 2}`}
              onClick={() => onSelect(card.type)}
              style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 16, padding: "32px 28px", cursor: "pointer",
                transition: "all 0.25s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = C.accent;
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = `0 8px 32px ${C.accentGlow}`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = C.border;
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 16 }}>{card.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{card.title}</h3>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{card.desc}</p>
              <div style={{ marginTop: 20, color: C.accent, fontSize: 13, fontWeight: 600 }}>
                Analyze → 
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── SCREEN: INPUT ────────────────────────────────────────────────────────────
const InputScreen = ({ type, onAnalyze, onBack }) => {
  const [value, setValue] = useState("");
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const config = {
    url: { icon: "🔗", label: "URL Scanner", placeholder: "https://example.com/suspicious-link", inputType: "url" },
    text: { icon: "📄", label: "Text Detection", placeholder: "Paste email, message, or any text to analyze..." },
    image: { icon: "🖼", label: "Image Analysis", placeholder: null },
  }[type];

  const handleSubmit = () => {
    if (type === "image") {
      if (!file) return;
      onAnalyze({ type, file });
    } else {
      if (!value.trim()) return;
      onAnalyze({ type, value: value.trim() });
    }
  };

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <GridBg />
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 32px", borderBottom: `1px solid ${C.border}`,
        background: `${C.bg}CC`, backdropFilter: "blur(12px)"
      }}>
        <Logo size={22} />
        <Btn variant="ghost" onClick={onBack} style={{ padding: "8px 16px", fontSize: 13 }}>← Back</Btn>
      </nav>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "60px 24px", position: "relative", zIndex: 1 }}>
        <div className="fade-up" style={{ marginBottom: 40 }}>
          <p className="mono" style={{ fontSize: 11, color: C.accent, letterSpacing: 2, marginBottom: 12 }}>
            {config.icon} {config.label.toUpperCase()}
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1 }}>Analyze {type}</h1>
        </div>

        <div className="fade-up-2" style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 16, padding: 28, marginBottom: 20
        }}>
          {type === "image" ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => {
                e.preventDefault(); setDragging(false);
                const f = e.dataTransfer.files[0];
                if (f && f.type.startsWith("image/")) setFile(f);
              }}
              onClick={() => fileRef.current.click()}
              style={{
                border: `2px dashed ${dragging ? C.accent : C.border}`,
                borderRadius: 12, padding: "48px 24px",
                textAlign: "center", cursor: "pointer", transition: "all 0.2s",
                background: dragging ? C.accentDim : "transparent"
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={e => setFile(e.target.files[0])}
              />
              {file ? (
                <div>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
                  <div style={{ fontWeight: 600 }}>{file.name}</div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                    {(file.size / 1024).toFixed(0)} KB • Click to change
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🖼</div>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Drop image here or click to upload</div>
                  <div style={{ fontSize: 13, color: C.muted }}>PNG, JPG, WEBP up to 10MB</div>
                </div>
              )}
            </div>
          ) : type === "text" ? (
            <Input
              label="Paste text to analyze"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={config.placeholder}
              rows={8}
            />
          ) : (
            <Input
              label="Enter URL"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={config.placeholder}
            />
          )}
        </div>

        <div className="fade-up-3" style={{ display: "flex", gap: 12 }}>
          <Btn
            onClick={handleSubmit}
            disabled={(type === "image" ? !file : !value.trim())}
            style={{ flex: 1, justifyContent: "center", padding: "14px 24px" }}
          >
            🔍 Analyze Now
          </Btn>
          <Btn variant="muted" onClick={onBack}>Cancel</Btn>
        </div>
      </div>
    </div>
  );
};

// ─── SCREEN: ANALYZING ───────────────────────────────────────────────────────
const AnalyzingScreen = ({ type }) => {
  const steps = {
    url: ["Fetching URL metadata...", "Running WHOIS lookup...", "Checking PhishTank database...", "Scanning page content..."],
    text: ["Tokenizing input...", "Running NLP model...", "Detecting phishing patterns...", "Computing risk score..."],
    image: ["Extracting image features...", "Running OCR scan...", "Analyzing visual content...", "Generating threat assessment..."],
  }[type] || [];

  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step < steps.length - 1) {
      const t = setTimeout(() => setStep(s => s + 1), 900);
      return () => clearTimeout(t);
    }
  }, [step, steps.length]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
      <GridBg />
      <div style={{ textAlign: "center", position: "relative", zIndex: 1, padding: 24 }}>
        {/* Radar animation */}
        <div style={{ width: 120, height: 120, position: "relative", margin: "0 auto 40px" }}>
          <div style={{
            width: 120, height: 120, borderRadius: "50%",
            border: `2px solid ${C.accent}44`,
            position: "absolute", animation: "pulse 2s ease-in-out infinite"
          }} />
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            border: `2px solid ${C.accent}66`,
            position: "absolute", top: 20, left: 20,
            animation: "pulse 2s ease-in-out infinite 0.3s"
          }} />
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: C.accent, opacity: 0.8,
            position: "absolute", top: 40, left: 40,
            animation: "pulse 1s ease-in-out infinite"
          }} />
        </div>

        <h2 className="mono" style={{ fontSize: 18, color: C.accent, letterSpacing: 2, marginBottom: 24 }}>
          ANALYZING {type.toUpperCase()}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 280, margin: "0 auto" }}>
          {steps.map((s, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10, fontSize: 13,
              color: i <= step ? C.text : C.muted,
              transition: "color 0.3s"
            }}>
              <span style={{ color: i < step ? C.safe : i === step ? C.accent : C.muted }}>
                {i < step ? "✓" : i === step ? "›" : "○"}
              </span>
              {s}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── SCREEN: RESULTS ─────────────────────────────────────────────────────────
const ResultsScreen = ({ result, onBack, onDownload }) => {
  const { risk_score, classification, detected_issues = [], red_flags = [] } = result;

  const colors = {
    "Safe": C.safe,
    "Suspicious": C.warn,
    "High Risk": C.danger,
  };
  const riskColor = colors[classification] || C.muted;

  const bgColors = {
    "Safe": "#10B98122",
    "Suspicious": "#F59E0B22",
    "High Risk": "#EF444422",
  };
  const riskBg = bgColors[classification] || C.surfaceAlt;

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      <GridBg />
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 32px", borderBottom: `1px solid ${C.border}`,
        background: `${C.bg}CC`, backdropFilter: "blur(12px)"
      }}>
        <Logo size={22} />
        <Btn variant="ghost" onClick={onBack} style={{ padding: "8px 16px", fontSize: 13 }}>← New Scan</Btn>
      </nav>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px", position: "relative", zIndex: 1 }}>

        {/* Score Banner */}
        <div className="fade-up" style={{
          background: riskBg,
          border: `1px solid ${riskColor}44`,
          borderRadius: 20, padding: "36px 32px", marginBottom: 24,
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24
        }}>
          <div>
            <p className="mono" style={{ fontSize: 11, color: riskColor, letterSpacing: 2, marginBottom: 8 }}>
              ANALYSIS COMPLETE
            </p>
            <div style={{ fontSize: 56, fontWeight: 800, color: riskColor, lineHeight: 1, animation: "scoreCount 0.5s ease" }}>
              {risk_score}
              <span style={{ fontSize: 24, color: C.muted }}>/100</span>
            </div>
            <div style={{ fontSize: 14, color: C.muted, marginTop: 6 }}>Risk Score</div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{
              display: "inline-block",
              background: riskColor, color: C.bg,
              padding: "10px 24px", borderRadius: 40,
              fontSize: 16, fontWeight: 800, letterSpacing: 1,
              marginBottom: 8
            }}>
              {classification.toUpperCase()}
            </div>
            <div style={{ fontSize: 13, color: C.muted }}>
              {result.analysis_type?.toUpperCase()} scan
            </div>
          </div>
        </div>

        {/* Input Preview */}
        <div className="fade-up-2" style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: "16px 20px", marginBottom: 24
        }}>
          <span className="mono" style={{ fontSize: 11, color: C.muted, letterSpacing: 1 }}>INPUT: </span>
          <span style={{ fontSize: 13, color: C.text, wordBreak: "break-all" }}>{result.input}</span>
        </div>

        {/* Issues */}
        {detected_issues.length > 0 && (
          <div className="fade-up-3" style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 16, padding: "24px", marginBottom: 20
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span>⚠️</span> Detected Issues ({detected_issues.length})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {detected_issues.map((issue, i) => (
                <div key={i} style={{ display: "flex", gap: 10, fontSize: 14, color: C.muted, padding: "8px 12px", background: C.surfaceAlt, borderRadius: 8 }}>
                  <span style={{ color: C.warn }}>·</span> {issue}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Red Flags */}
        {red_flags.length > 0 && (
          <div className="fade-up-4" style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: C.danger, display: "flex", alignItems: "center", gap: 8 }}>
              🚩 Red Flags ({red_flags.length})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {red_flags.map((flag, i) => (
                <div key={i} style={{
                  background: "#EF444411", border: `1px solid ${C.danger}33`,
                  borderLeft: `3px solid ${C.danger}`,
                  borderRadius: "0 12px 12px 0", padding: "16px 18px"
                }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.danger, marginBottom: 6 }}>{flag.flag}</div>
                  <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{flag.explanation}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OCR Preview */}
        {result.extracted_text && (
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: "20px", marginBottom: 24
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: C.accent }}>
              📝 Extracted Text (OCR)
            </h3>
            <p style={{ fontSize: 13, color: C.muted, fontStyle: "italic", lineHeight: 1.6 }}>
              "{result.extracted_text}"
            </p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Btn onClick={onDownload} variant="ghost" style={{ flex: 1, justifyContent: "center" }}>
            ⬇ Download PDF Report
          </Btn>
          <Btn onClick={onBack} style={{ flex: 1, justifyContent: "center" }}>
            🔍 New Scan
          </Btn>
        </div>
      </div>
    </div>
  );
};

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("landing");
  const [user, setUser] = useState(null);
  const [scanType, setScanType] = useState(null);
  const [result, setResult] = useState(null);
  const { history, loading: historyLoading, addResult, clearHistory } = useScanHistory(user);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      if (u && screen === "auth") setScreen("home");
    });
    return unsub;
  }, [screen]);

  const handleAnalyze = async ({ type, value, file }) => {
    setScreen("analyzing");

    try {
      let res;
      if (type === "url") {
        const r = await fetch(`${API_BASE}/analyze/url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: value })
        });
        res = await r.json();
      } else if (type === "text") {
        const r = await fetch(`${API_BASE}/analyze/text`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: value })
        });
        res = await r.json();
      } else if (type === "image") {
        const formData = new FormData();
        formData.append("file", file);
        const r = await fetch(`${API_BASE}/analyze/image`, { method: "POST", body: formData });
        res = await r.json();
      }

      setResult(res);
      addResult(res);
      setScreen("results");
    } catch (err) {
      console.error(err);
      setResult({
        risk_score: 0, classification: "Error",
        detected_issues: ["Failed to connect to analysis server. Make sure the backend is running."],
        red_flags: [], analysis_type: type, input: value || file?.name || ""
      });
      setScreen("results");
    }
  };

  const handleDownload = async () => {
    if (!result) return;
    try {
      const r = await fetch(`${API_BASE}/report/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis_type: result.analysis_type,
          input_data: result.input,
          risk_score: result.risk_score,
          classification: result.classification,
          detected_issues: result.detected_issues || [],
          red_flags: result.red_flags || []
        })
      });

      if (!r.ok) {
        const errText = await r.text();
        alert(`Report generation failed: ${errText}`);
        return;
      }

      const contentType = r.headers.get("content-type") || "";
      if (!contentType.includes("pdf")) {
        alert("Server returned an unexpected response. Check the backend is running.");
        return;
      }

      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "threat_lens_report.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      alert("Report download failed. Make sure the backend is running on port 8000.");
    }
  };

  return (
    <>
      <GlobalStyle />
      {screen === "landing" && <LandingScreen onEnter={() => setScreen(user ? "home" : "auth")} />}
      {screen === "auth" && <AuthScreen onAuth={() => setScreen("home")} />}
      {screen === "home" && (
        <HomeScreen
          user={user}
          onSelect={t => { setScanType(t); setScreen("input"); }}
          onSignOut={() => { signOut(auth); setScreen("landing"); }}
          onHistory={() => setScreen("history")}
        />
      )}
      {screen === "history" && (
        <HistoryScreen
          history={history}
          loading={historyLoading}
          onReview={item => { setResult(item); setScreen("results"); }}
          onClear={clearHistory}
          onBack={() => setScreen("home")}
        />
      )}
      {screen === "input" && (
        <InputScreen
          type={scanType}
          onAnalyze={handleAnalyze}
          onBack={() => setScreen("home")}
        />
      )}
      {screen === "analyzing" && <AnalyzingScreen type={scanType} />}
      {screen === "results" && result && (
        <ResultsScreen
          result={result}
          onBack={() => setScreen("home")}
          onDownload={handleDownload}
        />
      )}
    </>
  );
}