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
      <h1 style={{ color: "white", fontSize: 48, margin: "0 0 20px", textAlign: "center" }}>
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
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />

          {error && <p style={{ color: "crimson", margin: "12px 0 0" }}>⚠️ {error}</p>}

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
        <div className="logo">🍽️<span>Fuddy</span></div>
        <div className="nav-right">
          <span className="user-name">👤 {user.name}</span>
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </nav>

      <main className="main-content">
        <section className="hero">
          <div>
            <h1>Analyze Your <span>Food</span></h1>
            <p>Snap a photo and know what you are eating.</p>
          </div>
          <div className="hero-emoji">🥗</div>
        </section>

        <section className="classifier-card">
          <h2>📸 Upload Food Image</h2>
          <p>Select an image of your food to begin AI analysis.</p>

          <label className="upload-box">
            <input type="file" accept="image/*" onChange={onSelect} />
            {preview ? (
              <img src={preview} alt="food" className="preview-image" />
            ) : (
              <>
                <div className="upload-icon">📷</div>
                <h3>Click to choose an image</h3>
              </>
            )}
          </label>

          <button className="analyze-btn" onClick={onAnalyze} disabled={loading}>
            {loading ? "🤖 AI Analyzing..." : "🤖 Analyze Food"}
          </button>

          {loading && (
            <p style={{ color: "#999" }}>First request can take up to a minute if the server is asleep.</p>
          )}
          {error && <p style={{ color: "crimson" }}>⚠️ {error}</p>}
        </section>

        {result && (
          <section className="result-section">
            <h2>Analysis Result</h2>
            <div className="result-card">
              <div className="food-result">
                <div className="food-icon">🍛</div>
                <div>
                  <div className="small-title">DETECTED FOOD</div>
                  <h1>{result.food}</h1>
                  <span className="category">
                    {result.serving ? `${result.serving} · ` : ""}Confidence {result.confidence}%
                  </span>
                </div>
              </div>

              <div className="nutrition-grid">
                <div className="nutrition-card"><span>🔥</span><p>Calories</p><h3>{result.calories} kcal</h3></div>
                <div className="nutrition-card"><span>💪</span><p>Protein</p><h3>{result.protein} g</h3></div>
                <div className="nutrition-card"><span>🍞</span><p>Carbs</p><h3>{result.carbs} g</h3></div>
                <div className="nutrition-card"><span>🧈</span><p>Fat</p><h3>{result.fat} g</h3></div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer>© Fuddy · AI Food Analyzer</footer>
    </div>
  );
}

// ---------- App ----------
export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(SESSION_KEY));
      if (s) setUser(s);
    } catch {}
  }, []);

  const login = (u) => {
    setUser(u);
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(u)); } catch {}
  };
  const logout = () => {
    setUser(null);
    try { localStorage.removeItem(SESSION_KEY); } catch {}
  };

  return user ? <Dashboard user={user} onLogout={logout} /> : <Auth onLogin={login} />;
}