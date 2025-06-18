import axios from "axios";

// ✅ Use the backend URL from your .env file
const TRANSLATE_URL = import.meta.env.VITE_TRANSLATE_URL;

export const translateMessage = async (text, from, to) => {
  try {
    console.log("🔄 Incoming message for translation:", { text, from, to });

    const res = await axios.post(`${TRANSLATE_URL}/translate`, {
      q: text,
      source: from,
      target: to,
      format: "text"
    });

    console.log("✅ Translated:", res.data.translatedText);
    return res.data.translatedText;

  } catch (err) {
    console.error("❌ Translation failed:", err.response?.data || err.message);
    return text; // fallback to original
  }
};
