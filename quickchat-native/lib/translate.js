import axios from "axios";

const BASE_URL = "https://google-translate-python.onrender.com";

export const translateMessage = async (text, source, target) => {
  if (!text || !source || !target) {
    console.warn("🚫 Missing translation input", { text, source, target });
    return text;
  }

  try {
    const payload = {
      q: text,        // ✅ KEY FIXED: must be `q`
      source: source,
      target: target,
    };

    console.log("🌍 Sending to translator:", payload);

    const res = await axios.post(`${BASE_URL}/translate`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return res.data.translatedText || text;
  } catch (err) {
    console.error("❌ Translation error:", err.response?.data || err.message);
    return text;
  }
};
