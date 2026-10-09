import React, { useState } from "react";
import "./App.css";

// Backend (Flask) ka address. Port 5000 hona chahiye.
const API_URL = "http://127.0.0.1:5000/predict";

function App() {
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [name, setName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // =========================
  // LOGIN
  // =========================
  const handleLogin = (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    setUser({
      name: email.split("@")[0],
      email: email,
    });

    setPage("dashboard");
  };

  // =========================
  // REGISTER
  // =========================
  const handleRegister = (e) => {
    e.preventDefault();

    if (!name || !registerEmail || !registerPassword) {
      alert("Please fill all fields");
      return;
    }

    alert("Registration successful! Please login.");

    setEmail(registerEmail);
    setPassword(registerPassword);
    setPage("login");
  };

  // =========================
  // IMAGE UPLOAD
  // =========================
  const handleImageUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setPrediction(null);
    setError("");
  };

  // =========================
  // REAL AI FOOD ANALYSIS
  // =========================
  const analyzeFood = async () => {
    if (!image) {
      alert("Please upload a food image first.");
      return;
    }

    setLoading(true);
    setPrediction(null);
    setError("");

    try {
      const formData = new FormData();

      formData.append("image", image);

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Food detection failed.");
      }

      setPrediction(data);
    } catch (err) {
      console.error(err);

      // TypeError = server tak pahunch hi nahi paye (server band hai)
      if (err instanceof TypeError) {
        setError(
          "AI server is not connected. Please start the Python backend."
        );
      } else {
        // Backend ka asli error (API key, quota, model name, etc.)
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOGOUT
  // =========================
  const logout = () => {
    setUser(null);
    setImage(null);
    setPreview(null);
    setPrediction(null);
    setError("");
    setPage("login");
  };

  // =========================
  // LOGIN PAGE
  // =========================
  if (page === "login") {
    return (
      <div className="auth-container">
        <div className="auth-left">
          <div className="brand">🍴</div>

          <h1>AI Food</h1>

          <h2>Image Classifier</h2>

          <p>
            Discover your food using Artificial Intelligence. Upload a food
            image and analyze it instantly.
          </p>
        </div>

        <div className="auth-card">
          <div className="auth-icon">🔐</div>

          <h2>Welcome Back!</h2>

          <p className="auth-subtitle">Login to your Food Analysis account</p>

          <form onSubmit={handleLogin}>
            <label>Email Address</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit" className="primary-btn">
              🚀 Login
            </button>
          </form>

          <p className="switch-text">
            Don't have an account?{" "}
            <span onClick={() => setPage("register")}>Create Account</span>
          </p>
        </div>
      </div>
    );
  }

  // =========================
  // REGISTER PAGE
  // =========================
  if (page === "register") {
    return (
      <div className="auth-container">
        <div className="auth-left">
          <div className="brand">🍎</div>

          <h1>Join Food AI</h1>

          <p>
            Create your account and start analyzing your favorite foods using
            AI.
          </p>

          <div className="feature-list">
            <div>📷 Upload Food Images</div>

            <div>🤖 AI Classification</div>

            <div>📊 Food Analysis</div>

            <div>❤️ Nutrition Information</div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-icon">📝</div>

          <h2>Create Account</h2>

          <p className="auth-subtitle">Register for your Food AI account</p>

          <form onSubmit={handleRegister}>
            <label>Full Name</label>

            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <label>Email Address</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
            />

            <label>Password</label>

            <input
              type="password"
              placeholder="Create password"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
            />

            <button type="submit" className="primary-btn">
              ✨ Create Account
            </button>
          </form>

          <p className="switch-text">
            Already have an account?{" "}
            <span onClick={() => setPage("login")}>Login</span>
          </p>
        </div>
      </div>
    );
  }

  // =========================
  // DASHBOARD
  // =========================
  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="logo">
          🍴 <span>FoodAI</span>
        </div>

        <div className="nav-right">
          <span className="user-name">👤 {user?.name}</span>

          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </nav>

      <main className="main-content">
        <div className="hero">
          <div>
            <h1>
              AI Food Image
              <span> Classifier</span>
            </h1>

            <p>
              Upload a food image and let Artificial Intelligence identify the
              food.
            </p>
          </div>

          <div className="hero-emoji">🍕</div>
        </div>

        <div className="classifier-card">
          <h2>📸 Upload Food Image</h2>

          <p>Select an image of your food to begin AI analysis.</p>

          <label className="upload-box">
            {preview ? (
              <img
                src={preview}
                alt="Food Preview"
                className="preview-image"
              />
            ) : (
              <>
                <div className="upload-icon">📤</div>

                <h3>Upload Image</h3>

                <p>JPG, JPEG or PNG</p>
              </>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </label>

          <button
            className="analyze-btn"
            onClick={analyzeFood}
            disabled={loading}
          >
            {loading ? "🤖 AI Analyzing..." : "🔍 Analyze Food"}
          </button>

          {error && <div className="error-message">❌ {error}</div>}
        </div>

        {prediction && (
          <div className="result-section">
            <h2>🍽️ AI Food Analysis Result</h2>

            <div className="result-card">
              <div className="food-result">
                <div className="food-icon">🍴</div>

                <div>
                  <p className="small-title">AI DETECTED FOOD</p>

                  <h1>{prediction.name}</h1>

                  <span className="category">{prediction.category}</span>
                </div>
              </div>

              <div className="confidence">
                <strong>AI Confidence:</strong> {prediction.confidence}%
              </div>

              {prediction.low_confidence && (
                <div className="error-message">
                  ⚠️ AI is not very sure about this result.
                </div>
              )}

              {prediction.serving_note && <p>{prediction.serving_note}</p>}

              {prediction.health_tip && <p>💡 {prediction.health_tip}</p>}

              <div className="nutrition-grid">
                <div className="nutrition-card">
                  <span>🔥</span>

                  <p>Calories</p>

                  <h3>{prediction.calories}</h3>
                </div>

                <div className="nutrition-card">
                  <span>💪</span>

                  <p>Protein</p>

                  <h3>{prediction.protein}</h3>
                </div>

                <div className="nutrition-card">
                  <span>🍞</span>

                  <p>Carbs</p>

                  <h3>{prediction.carbs}</h3>
                </div>

                <div className="nutrition-card">
                  <span>🥑</span>

                  <p>Fat</p>

                  <h3>{prediction.fat}</h3>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer>© 2026 FoodAI — AI Food Image Classifier</footer>
    </div>
  );
}

export default App;
