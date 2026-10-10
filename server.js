import React, { useState, useEffect } from "react";
import "./App.css";
import { analyzeFood } from "./apicall";

// ---------- tiny browser-only auth (demo) ----------
const USERS_KEY = "fuddy_users";
const SESSION_KEY = "fuddy_session";

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
const readUsers = () => {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; } catch { return {}; }
};
const writeUsers = (u) => {
  try { localStorage.setItem(USERS_KEY, JSON.stringify(u)); } catch {}
};

// ---------- Login / Register ----------
function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const key = email.trim().toLowerCase();
    if (!key || !password) return setError("Please fill all fields.");
    const users = readUsers();
    const hash = await sha256(password);

    if (mode === "register") {
      if (!name.trim()) return setError("Please enter your name.");
      if (users[key]) return setError("This email is already registered.");
      users[key] = { name: name.trim(), hash };
      writeUsers(users);
      onLogin({ name: name.trim(), email: key });
    } else {
      const u = users[key];
      if (!u || u.hash !== hash) return setError("Wrong email or password.");
      onLogin({ name: u.name, email: key });
    }
  };

  return (
    <div
      className="auth-container"
      style={{ flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px" }}
    >
      <h1 className="auth-title" style={{ color: "white", fontSize: 48, margin: "0 0 20px", textAlign: "center" }}>
        🍽️ FoodApp
      </h1>
      <div className="auth-card" style={{ margin: "0 auto", width: "100%" }}>
        <div className="auth-icon">{mode === "login" ? "🔐" : "📝"}</div>
        <h2>{mode === "login" ? "Welcome Back" : "Create Account"}</h2>
        <p className="auth-subtitle">
          {mode === "login" ? "Login to continue" : "Register to get started"}
        </p>

        <form onSubmit={submit}>
          {mode === "register" && (
            <>
              <label>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </>
          )}
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />

          <label>Password</label>
          <div className="pw-wrap">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
            <button
              type="button"
              className="pw-toggle"
              onClick={() => setShowPw(!showPw)}
              aria-label={showPw ? "Hide password" : "Show password"}
              title={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? "🙈" : "👁️"}
            </button>
          </div>

          {error && <p className="error-msg">⚠️ {error}</p>}

          <button className="primary-btn" type="submit">
            {mode === "login" ? "Login" : "Register"}
          </button>
        </form>

        <p className="switch-text">
          {mode === "login" ? "New here?" : "Already have an account?"}
          <span onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
            {mode === "login" ? "Register" : "Login"}
          </span>
        </p>
      </div>
    </div>
  );
}

// ---------- Dashboard ----------
function Dashboard({ user, onLogout }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const onSelect = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError("");
  };

  const onAnalyze = async () => {
    if (!file) return setError("Please select an image first.");
    setLoading(true);
    setError("");
    setResult(null);
    try {
      setResult(await analyzeFood(file));
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="logo">🍽️<span>FoodApp</span></div>
        <div className="nav-right">
          <span className="user-name">👤 {user.name}</span>
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </nav>

      <main className="main-content">
        <section className="hero">
          <div>
            <h1>Analyze Your