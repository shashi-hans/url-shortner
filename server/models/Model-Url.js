const mongoose = require("mongoose");

const UrlSchema = new mongoose.Schema({
  shortId: {
    type: String,
    required: true,
    unique: true,
  },
  shortUrl: {
    type: String,
    required: true,
  },
  originalUrl: {
    type: String,
    required: true,
    // One short link per original URL; /shorten relies on this to stay race-free
    unique: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  clicks: {
    type: Number,
    default: 0,
  },
  // Holds the most recent MAX_VISIT_HISTORY visits; `clicks` holds the total.
  visitHistory: {
    type: [{
      timestamp: {
        type: Date,
        default: Date.now,
      },
    }],
  },
});

UrlSchema.statics.MAX_VISIT_HISTORY = 1000;

module.exports = mongoose.model("url", UrlSchema);
