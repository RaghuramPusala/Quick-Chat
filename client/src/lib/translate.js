import axios from "axios";
const TRANSLATE_URL = import.meta.env.VITE_TRANSLATE_URL;

export const translateMessage = async (text, from, to) => {
  try {
    const res = await axios.post(`${TRANSLATE_URL}/translate`, {
      q: text,
      source: from,
      target: to,
      format: "text",
    });
    return res.data.data.translations[0].translatedText;
  } catch (err) {
    console.error("Translation failed:", err.response?.data || err.message);
    throw err;
  }
};
