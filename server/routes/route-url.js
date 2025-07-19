const express = require('express');
const router = express.Router();
const validUrl = require('valid-url');
const shortid = require('shortid');
const config = require('config');

//  Load Url model
const Url = require('../models/Model-Url');

// @route POST api/url/test
// @description Test url route
// @access Public
router.post('/test', (req, res) => {
  res.send('Hello World!');
});

// @route     http://localhost:4000/api/url/shorten
// @desc      Create short URL
router.post('/shorten', async (req, res) => {
  const originalUrl = req.body.url;
  const baseUrl = config.get('baseUrl');

  console.log('originalUrl >>>', originalUrl);

  // Check base url
  if (!validUrl.isUri(baseUrl)) {
    console.log('Invalid base url');
    return res.status(401).json('Invalid base url');
  }

  // Check original url validity
  if (validUrl.isUri(originalUrl)) {
    try {//Check if input url is already present in DB
      let url = await Url.findOne({ originalUrl }); 
      if (url) {
        console.log("<<<<<<< Url Already Present >>>>>>>>>")
        res.json(url);
      } else {//If input url not present in DB
        // Create Short url code
        const shortId = shortid.generate();
        console.log('shortid >>>', shortId);
        const shortUrl = baseUrl + '/' + shortId;

        url = new Url({
          shortId: shortId,
          shortUrl: shortUrl,
          originalUrl: originalUrl,
          date: Date.now(),
        });
       await url.save();
       console.log('shortUrl >>>', shortUrl);
        return res.json(shortUrl);
      }
    } catch (err) {
      console.error(err);
      res.status(500).json('Server error');
    }
  } else {
    res.status(401).json('Invalid Url Provided');
  }
});

module.exports = router;
