// server/routes/translateRoute.js
import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/', async (req, res) => {
  const { text, source, target } = req.body;

  try {
    const response = await axios.post('http://localhost:5001/translate', {
      q: text,
      source,
      target,
      format: 'text'
    });

    res.json({ translatedText: response.data.translatedText });
  } catch (err) {
    console.error('Error from LibreTranslate:', err.message);
    res.status(500).json({ error: 'Translation failed' });
  }
});

export default router;
