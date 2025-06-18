import axios from "axios";

// Use your deployed translation service
const TRANSLATE_URL = import.meta.env.VITE_TRANSLATE_URL || "https://quick-chat-translate.onrender.com";

export const translateMessage = async (text, from, to) => {
  try {
    const res = await axios.post(`${TRANSLATE_URL}/translate`, {
      q: text,
      source: from,
      target: to,
      format: "text",
    });
    return res.data.translatedText;
  } catch (err) {
    console.error("Translation failed:", err.message);
    throw err;
  }
};
