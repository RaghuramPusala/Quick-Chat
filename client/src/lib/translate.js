import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export const translateMessage = async (text, from, to) => {
  try {
    const res = await axios.post(`${API}/api/translate`, {
      text,
      source_lang: from,
      target_lang: to,
    });
    return res.data.translatedText;
  } catch (err) {
    console.error("Translation failed:", err.message);
    throw err;
  }
};

