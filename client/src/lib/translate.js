import axios from "axios";

// This URL points to your Go-based LibreTranslate server
const TRANSLATE_API = import.meta.env.VITE_TRANSLATE_URL;

export const translateMessage = async (text, from, to) => {
  try {
    const res = await axios.post(`${TRANSLATE_API}/translate`, {
      q: text,
      source: from,
      target: to,
      format: "text",
    });

    return res.data.translatedText;
  } catch (err) {
    console.error("Translation failed:", err.message);
    return text; // fallback to original message if translation fails
  }
};

