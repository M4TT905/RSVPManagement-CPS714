// backend/controllers/interestController.js
const Interest = require('../models/interestModel');
const Event = require('../models/eventModel'); // Assume Event model exists from Sub-project 3
const NotificationService = require('../services/notificationService'); // From Sub-project 8

// Toggle interest for a user/event (only if no capacity limit)
exports.toggleInterest = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id; // From auth middleware (Sub-project 1)

    // Check if event has capacity limit
    const event = await Event.findById(eventId);
    if (event.capacity !== null && event.capacity > 0) {
      return res.status(400).json({ error: 'Interest only for unlimited events' });
    }

    // Check existing interest
    const existing = await Interest.findOne({ userId, eventId });
    let isInterested;

    if (existing) {
      // Remove interest
      await Interest.findByIdAndDelete(existing._id);
      isInterested = false;
    } else {
      // Add interest
      const newInterest = new Interest({ userId, eventId });
      await newInterest.save();
      isInterested = true;

      // Trigger reminder (Sub-project 8: 24h before event)
      if (isInterested) {
        NotificationService.scheduleReminder(userId, eventId, event.startTime);
      }
    }

    // Get updated count
    const count = await Interest.countDocuments({ eventId });

    res.json({ isInterested, count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get interest status & count for event
exports.getInterestStatus = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const isInterested = await Interest.exists({ userId, eventId });
    const count = await Interest.countDocuments({ eventId });

    res.json({ isInterested: !!isInterested, count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
