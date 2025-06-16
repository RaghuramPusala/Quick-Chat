// client/src/lib/translate.js
import axios from 'axios';

export const translateMessage = async (text, from, to) => {
  try {
    const res = await axios.post('http://localhost:5000/api/translate', {
      text,
      source: from,
      target: to,
    });

    return res.data.translatedText;
  } catch (err) {
    console.error('Translation failed:', err.message);
    throw err;
  }
};

