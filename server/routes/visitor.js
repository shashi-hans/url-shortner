const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');

// Increment visitor count atomically so concurrent visits are not lost
router.post('/visit', async (req, res) => {
  try {
    const doc = await Visitor.findOneAndUpdate(
      {},
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );
    res.json({ count: doc.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get visitor count
router.get('/count', async (req, res) => {
  try {
    const doc = await Visitor.findOne();
    res.json({ count: doc?.count || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
