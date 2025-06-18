// server/routes/translateRoute.js
import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/', async (req, res) => {
  const { text, source, target } = req.body;

  try {
    const response = await axios.post('https://quick-chat-11.onrender.com/translate', {
      q: text,
      source,
      target,
      format: 'text'
    });

    res.json({ translatedText: response.data.translatedText });
  } catch (err) {
    console.error('Error from LibreTranslate:', err.response?.data || err.message);
    res.status(500).json({ error: 'Translation failed' });
  }
});

export default router;
