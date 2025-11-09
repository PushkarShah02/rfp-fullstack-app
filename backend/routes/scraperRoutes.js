import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import authMiddleware from './authMiddleware.js';

const router = express.Router();

// @route   POST /api/scrape
// @desc    Scrape a URL for its text content
router.post('/', authMiddleware, async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ msg: 'Please provide a URL' });
  }

  try {
    // Fetch the HTML from the URL
    const { data } = await axios.get(url, {
      // Add headers to mimic a real browser
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // Load the HTML into Cheerio
    const $ = cheerio.load(data);

    // --- THIS IS THE CUSTOM PART ---
    // You must inspect your target RFP sites to find the right selector.
    // 'body' is a good default, but 'main', '#content', '.rfp-details' might be better.
    // This scrapes ALL text from the <body> tag.
    const rawText = $('body').text();

    // Basic cleanup
    const cleanedText = rawText.replace(/\s\s+/g, ' ').trim();

    res.json({ text: cleanedText });

  } catch (error) {
    console.error(error);
    // Handle common scraping errors
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ msg: 'Site not found (404)' });
    }
    if (error.code === 'ECONNREFUSED') {
      return res.status(500).json({ msg: 'Connection refused. Is the site down or blocking?' });
    }
    res.status(500).json({ msg: 'Scraping failed', error: error.message });
  }
});

export default router;