const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  count: {
    type: Number,
    required: true,
    default: 0,
  },
});

module.exports = mongoose.model('Visitor', visitorSchema);
