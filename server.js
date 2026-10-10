require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- Setup ----------
app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
});

if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is missing in environment variables!");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Models are tried in this order. If one is busy (503) or missing (404),
// the next one is used. Override with GEMINI_MODELS="a,b,c" on Render.
const MODELS = (
  process.env.GEMINI_MODELS ||
  "gemini-3.8-flash,gemini-3.6-flash,gemini-3.5-flash,gemini-3.1-flash-lite"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const getModel = (name) =>
  genAI.getGenerativeModel({
    model: name,
    generationConfig: { responseMimeType: "application/json" },
  });

const PROMPT = `Analyze this food image. Respond ONLY with JSON in this exact shape:
{
  "food": "name of the dish",
  "confidence": 0-100,
  "calories": number (kcal per typical serving),
  "protein": number (grams),
  "carbs": number (grams),
  "fat": number (grams),
  "serving": "serving size assumed, e.g. 1 piece"
}
If the image is not food, set "food" to "Not a food item" and all numbers to 0.`;

// ---------- Helpers ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const isBusy = (err) =>
  err?.status === 503 ||
  err?.status === 429 ||
  /503|429|overloaded|high demand|unavailable/i.test(err?.message || "");

const isNotFound = (err) =>
  err?.status === 404 || /404|not found|no longer available/i.test(err?.message || "");

async function generateWithFallback(parts) {
  let lastErr;
  for (const name of MODELS) {
    for (let i = 0; i < 2; i++) {
      try {
        const result = await getModel(name).generateContent(parts);
        console.log(`Analyzed with model: ${name}`);
        return result;
      } catch (err) {
        lastErr = err;
        if (isNotFound(err)) break; // try next model
        if (!isBusy(err)) throw err; // real error (bad key etc.)
        await sleep(1500 * (i + 1));
      }
    }
    console.warn(`Model ${name} unavailable, trying next...`);
  }
  throw lastErr;
}

// ---------- Routes ----------
app.get("/health", (req, res) => res.json({ ok: true }));

app.post("/api/analyze-food", upload.single("image"), async (req, res) => {
  const filePath = req.file?.path;
  try {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    const imageData = fs.readFileSync(filePath).toString("base64");

    const result = await generateWithFallback([
      PROMPT,
      { inlineData: { mimeType: req.file.mimetype, data: imageData } },
    ]);

    const text = result.response.text();
    let data;
    try {
      data = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      return res.status(502).json({ error: "AI returned an invalid response" });
    }
    res.json(data);
  } catch (err) {
    console.error("analyze-food error:", err);
    if (isBusy(err) || isNotFound(err)) {
      return res.status(503).json({ error: "AI is busy right now, please try again in a minute" });
    }
    res.status(500).json({ error: "Analysis failed" });
  } finally {
    if (filePath) fs.unlink(filePath, () => {});
  }
});

// ---------- Serve React build ----------
const buildPath = path.join(__dirname, "build");
app.use(express.static(buildPath));
app.use((req, res) => res.sendFile(path.join(buildPath, "index.html")));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));