import React, { useState } from "react";
import { analyzeFood } from "./apicall";

export default function App() {
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
      const data = await analyzeFood(file);
      setResult(data);
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false); // button always recovers
    }
  };

  return (
    <div style={styles.page}>
      <h1>📸 Upload Food Image</h1>
      <p style={{ color: "#777" }}>Select an image of your food to begin AI analysis.</p>

      <label style={styles.dropzone}>
        <input type="file" accept="image/*" onChange={onSelect} hidden />
        {preview ? (
          <img src={preview} alt="food" style={styles.preview} />
        ) : (
          <span>Click to choose an image</span>
        )}
      </label>

      <button onClick={onAnalyze} disabled={loading} style={styles.button}>
        {loading ? "🤖 AI Analyzing..." : "🤖 Analyze Food"}
      </button>

      {loading && (
        <p style={{ color: "#999" }}>
          First request can take up to a minute if the server is asleep.
        </p>
      )}

      {error && <p style={{ color: "crimson" }}>⚠️ {error}</p>}

      {result && (
        <div style={styles.card}>
          <h2>{result.food}</h2>
          <p>Confidence: {result.confidence}%</p>
          {result.serving && <p>Serving: {result.serving}</p>}
          <p>🔥 Calories: {result.calories} kcal</p>
          <p>💪 Protein: {result.protein} g</p>
          <p>🍞 Carbs: {result.carbs} g</p>
          <p>🧈 Fat: {result.fat} g</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { fontFamily: "Arial, sans-serif", textAlign: "center", padding: 24 },
  dropzone: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 220,
    maxWidth: 600,
    margin: "20px auto",
    border: "2px dashed #ff7a59",
    borderRadius: 16,
    background: "#fff9f7",
    cursor: "pointer",
  },
  preview: { maxWidth: "100%", maxHeight: 360, borderRadius: 8 },
  button: {
    padding: "14px 32px",
    border: "none",
    borderRadius: 12,
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    background: "linear-gradient(90deg,#ff9a85,#ff7a9c)",
    cursor: "pointer",
  },
  card: {
    maxWidth: 420,
    margin: "24px auto",
    padding: 20,
    borderRadius: 16,
    background: "#fff",
    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
    textAlign: "left",
  },
};
