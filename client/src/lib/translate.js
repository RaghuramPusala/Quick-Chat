import axios from "axios";

// Read base URL from environment variable (e.g. http://localhost:8000 or your Render URL)
const TRANSLATE_URL = import.meta.env.VITE_TRANSLATE_URL;

export const translateMessage = async (text, from, to) => {
  console.log("🔄 Incoming message for translation:", { text, from, to });

  try {
    const res = await axios.post(`${TRANSLATE_URL}/translate`, {
      q: text,
      source: from,
      target: to,
      format: "text",
    });

    const translated = res.data?.translatedText || res.data?.data?.translations?.[0]?.translatedText;

    console.log("✅ Translated:", translated);
    return translated;
  } catch (err) {
    console.error("❌ Translation failed:", err.message);
    return text; // fallback to original message text if translation fails
  }
};
