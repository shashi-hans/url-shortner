const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const config = require('config');

//  Load Url model
const Url = require('../models/Model-Url');

const MAX_URL_LENGTH = 2048;
const MAX_INSERT_ATTEMPTS = 3;
const DUPLICATE_KEY = 11000;

// 6 base64url characters (A-Z, a-z, 0-9, _ and -), 2^36 (about 68.7 billion) possible codes.
// 6 random bytes encode to 8 characters; each character carries 6 independent random bits, so the first 6 stay uniform.
const SHORT_ID_LENGTH = 6;
const generateShortId = () => crypto.randomBytes(6).toString('base64url').slice(0, SHORT_ID_LENGTH);

// Returns the parsed URL for http(s) input, or null. Blocks javascript:, data:, file: and similar schemes.
const parseHttpUrl = (value) => {
  if (typeof value !== 'string' || value.length > MAX_URL_LENGTH) return null;
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed : null;
  } catch {
    return null;
  }
};

// @route     POST /api/url/shorten
// @desc      Create short URL, or return the existing one for the same original URL
router.post('/shorten', async (req, res) => {
  const baseUrl = config.get('baseUrl');
  if (!parseHttpUrl(baseUrl)) {
    console.error('Invalid base url>>>', baseUrl);
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const parsed = parseHttpUrl(req.body?.url);
  if (!parsed) {
    return res.status(400).json({ error: 'Invalid Url Provided' });
  }
  const originalUrl = parsed.href;

  // A duplicate-key error means either a concurrent request inserted the same originalUrl
  // (the next attempt finds it) or the random shortId collided (the next attempt draws a new one).
  for (let attempt = 1; attempt <= MAX_INSERT_ATTEMPTS; attempt++) {
    const shortId = generateShortId();
    try {
      const url = await Url.findOneAndUpdate(
        { originalUrl },
        { $setOnInsert: { shortId, shortUrl: `${baseUrl}/${shortId}`, originalUrl } },
        { new: true, upsert: true, projection: { shortUrl: 1 } }
      );
      return res.json({ shortUrl: url.shortUrl });
    } catch (err) {
      if (err?.code === DUPLICATE_KEY && attempt < MAX_INSERT_ATTEMPTS) continue;
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  }
});

module.exports = router;
