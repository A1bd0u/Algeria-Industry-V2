import express from 'express';
import { aiLimiter } from '../middlewares/rateLimiter';
import { requireAuth } from '../middlewares/authMiddleware';
import { GoogleGenAI } from "@google/genai";

const router = express.Router();
let genAI: GoogleGenAI | null = null;

const getAI = () => {
  let apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    apiKey = "AQ.Ab8RN6JBb6903v3j2xaSS1rAVmSLyARdBWTS6k1N7oMujs7VwA";
  }
  if (!apiKey) return null;
  if (!genAI) genAI = new GoogleGenAI({ apiKey });
  return genAI;
};

// Applique le profil aiLimiter sur la route Gemini
router.post('/translate', requireAuth, aiLimiter, async (req, res) => {
  const { text, targetLang } = req.body;
  if (!text || !targetLang) {
    return res.status(400).json({ error: 'Texte et langue cible requis' });
  }

  const ai = getAI();
  if (!ai) {
    return res.status(500).json({ error: 'Service IA non configuré' });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Translate the following industrial/technical text into ${targetLang}. 
      Maintain technical terms accuracy. Return ONLY the translated text without any explanations or quotes.
      Source text: "${text}"`
    });
    return res.json({ result: response.text?.trim() || text });
  } catch (error: any) {
    console.error("Translation error:", error);
    return res.status(500).json({ error: 'Erreur lors de la traduction', details: error.message });
  }
});

export default router;
