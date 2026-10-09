require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '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');

app.get('/', (req, res) => {
  res.send('Backend Server is Running!');
});

app.post('/api/analyze-food', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image.' });
    }

    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString('base64'),
        mimeType: req.file.mimetype,
      },
    };

    // Updated model to gemini-2.5-flash
        const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const prompt = `Analyze this food image accurately. Return ONLY a valid JSON object in exactly this format:
{"name": "Food name", "category": "Category", "confidence": 90, "calories": "250 kcal", "protein": "8 g", "carbs": "40 g", "fat": "6 g", "serving_note": "Approximate values for one serving", "health_tip": "One short healthy tip", "low_confidence": false}
confidence must be a number from 0 to 100. If the image is not food, set name to "Not food" and low_confidence to true.`;

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    console.log("Raw Gemini AI Output:", responseText);

    const cleanJson = responseText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const foodData = JSON.parse(cleanJson);(cleanJson);
    res.json(foodData);

  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ error: 'Failed to analyze food image.', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
