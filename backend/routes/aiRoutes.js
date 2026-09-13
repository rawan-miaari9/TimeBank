import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import express from 'express';

// Load env vars FIRST — server.js's dotenv.config() runs after static
// imports are hoisted, so process.env keys would be undefined here.
dotenv.config();

const router = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post('/optimize-request', async (req, res) => {
  try {
    const { rawDescription, categories } = req.body;

    // 1. Validate user input
    if (!rawDescription || typeof rawDescription !== 'string' || rawDescription.trim().length < 5) {
      return res.status(400).json({ error: 'Input description is too short or invalid.' });
    }

    // 2. Control context size to manage tokens
    const sanitizedInput = rawDescription.trim().slice(0, 1000);

    const categoryNames = Array.isArray(categories)
      ? categories
          .filter((c) => typeof c === 'string' && c.trim())
          .slice(0, 50)
          .map((c) => c.trim())
      : [];

    const categoryInstruction = categoryNames.length
      ? `The available categories are: ${categoryNames.join(', ')}. Suggest the single closest matching category from this list.`
      : 'Suggest a suitable category.';

    // 3. Call Gemini model securely
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `Improve the following community service description to be clear, professional, and concise. Generate a catchy title and an enhanced description. ${categoryInstruction} Return valid JSON with keys "title", "enhancedDescription", and "category". Text: "${sanitizedInput}"`,
    });

    const textOutput = response.text;
    
    // 4. Validate and parse AI output safely
    let parsedData;
    try {
      const cleanJson = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleanJson);
    } catch (parseError) {
      return res.json({ enhancedDescription: textOutput, category: 'General' });
    }

    res.json(parsedData);

  } catch (error) {
    // 6. Handle AI service failures gracefully
    console.error('AI Service Error:', error);
    console.error('AI Error message:', error?.message);
    console.error('AI Error code:', error?.code);
    console.error('AI Error status:', error?.status);
    res.status(503).json({ error: 'AI enhancement service is temporarily unavailable. Please proceed with your original text.' });
  }
});

export default router;