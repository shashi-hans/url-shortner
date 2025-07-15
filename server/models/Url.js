const mongoose = require('mongoose');

const UrlSchema = new mongoose.Schema({
  shortId: {
    type: String,
    required: true,
    unique: true
  },
  shortUrl:{
    type: String,
    required: true
  },
  originalUrl: {
    type: String,
    required: true
    },
    date: {
      type: Date,
      default: Date.now()
    }
  });
module.exports = mongoose.model('url', UrlSchema);
