import { GoogleGenAI } from "@google/genai";

let genAI: GoogleGenAI | null = null;

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!genAI) genAI = new GoogleGenAI({ apiKey });
  return genAI;
};

export const translateDynamicContent = async (text: string, targetLang: string) => {
  const ai = getAI();
  if (!ai) return text;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following industrial/technical text into ${targetLang}. 
      Maintain technical terms accuracy. Return ONLY the translated text without any explanations or quotes.
      Source text: "${text}"`
    });

    return response.text?.trim() || text;
  } catch (error) {
    console.error("Translation error:", error);
    return text;
  }
};
