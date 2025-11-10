// backend/models/interestModel.js
const mongoose = require('mongoose');

const interestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // From Sub-project 1
    required: true,
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event', // From Sub-project 3
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for fast queries
interestSchema.index({ eventId: 1 });
interestSchema.index({ userId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('Interest', interestSchema);
