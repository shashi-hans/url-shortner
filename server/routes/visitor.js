const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');

// Increment visitor count
router.post('/visit', async (req, res) => {
  try {
    let doc = await Visitor.findOne();

    if (!doc) {
      doc = new Visitor({ count: 1 });
    } else {
      doc.count += 1;
    }

    await doc.save();
    res.json({ count: doc.count });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get visitor count
router.get('/count', async (req, res) => {
  try {
    const doc = await Visitor.findOne();
    res.json({ count: doc?.count || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
