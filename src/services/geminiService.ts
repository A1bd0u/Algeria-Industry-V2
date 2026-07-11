import axios from 'axios';

export const translateDynamicContent = async (text: string, targetLang: string) => {
  try {
    const response = await axios.post('/api/ai/translate', { text, targetLang }, { withCredentials: true });
    return response.data.result;
  } catch (error) {
    console.error("Translation error:", error);
    return text;
  }
};
