// waitlistController.js

const admin = require('firebase-admin');
const db = admin.firestore();
const NotificationService = require('./notificationService'); // handles email notifications

// Handles RSVP and adds user to waitlist if event is full
exports.handleRSVP = async (req, res) => {
  try {
    const { eventId, email } = req.body;

    // Check for missing info
    if (!eventId || !email) {
      return res.status(400).json({ error: 'eventId and email are required' });
    }

    // Get the event info from Firestore
    const eventRef = db.collection('Events').doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventData = eventDoc.data();
    const capacity = eventData.capacity || 0;

    // Count how many RSVPs exist for this event
    const rsvpSnap = await db.collection('RSVP').where('eventId', '==', eventId).get();
    const currentRSVPs = rsvpSnap.size;

    // If event is full → add to waitlist
    if (currentRSVPs >= capacity) {
      const waitlistRef = db.collection('Waitlist').doc(`${eventId}_${email}`);
      const waitlistDoc = await waitlistRef.get();

      if (waitlistDoc.exists) {
        return res.status(400).json({ message: 'Already on waitlist' });
      }

      // Add to waitlist with timestamp
      await waitlistRef.set({
        eventId,
        email,
        joinedAt: new Date(),
      });

      // Figure out user's position in the waitlist (FIFO)
      const queueSnap = await db.collection('Waitlist')
        .where('eventId', '==', eventId)
        .orderBy('joinedAt', 'asc')
        .get();

      const position = queueSnap.docs.findIndex(doc => doc.id === `${eventId}_${email}`) + 1;

      return res.json({
        status: 'waitlisted',
        message: `Event is full. You are #${position} on the waitlist.`,
        waitlistPosition: position,
      });
    }

    // If event not full → confirm RSVP
    await db.collection('RSVP').add({
      eventId,
      email,
      createdAt: new Date(),
    });

    return res.json({ status: 'confirmed', message: 'RSVP successful!' });

  } catch (err) {
    console.error('Error handling RSVP:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Cancels an RSVP and promotes the next person on the waitlist
exports.cancelRSVP = async (req, res) => {
  try {
    const { eventId, email } = req.body;

    if (!eventId || !email) {
      return res.status(400).json({ error: 'eventId and email are required' });
    }

    // Delete the user's RSVP
    const rsvpQuery = await db.collection('RSVP')
      .where('eventId', '==', eventId)
      .where('email', '==', email)
      .get();

    rsvpQuery.forEach(doc => doc.ref.delete());

    // Find the next person in line on the waitlist
    const waitlistQuery = await db.collection('Waitlist')
      .where('eventId', '==', eventId)
      .orderBy('joinedAt', 'asc')
      .limit(1)
      .get();

    // Promote them if someone exists
    if (!waitlistQuery.empty) {
      const nextUser = waitlistQuery.docs[0].data();

      // Add them to RSVP and remove from waitlist
      await db.collection('RSVP').add({
        eventId,
        email: nextUser.email,
        createdAt: new Date(),
      });
      await waitlistQuery.docs[0].ref.delete();

      // Send notification to promoted user
      await NotificationService.sendEmail(
        nextUser.email,
        '🎉 You’re off the waitlist!',
        `A spot opened up for ${eventId}! You’re now confirmed.`
      );
    }

    res.json({ message: 'RSVP canceled and waitlist updated.' });
  } catch (err) {
    console.error('Error canceling RSVP:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Returns a user's position in the waitlist
exports.getWaitlistPosition = async (req, res) => {
  try {
    const { eventId, email } = req.query;

    const queueSnap = await db.collection('Waitlist')
      .where('eventId', '==', eventId)
      .orderBy('joinedAt', 'asc')
      .get();

    const position = queueSnap.docs.findIndex(doc => doc.data().email === email) + 1;

    if (position === 0) {
      return res.status(404).json({ message: 'Not currently waitlisted.' });
    }

    res.json({ email, eventId, position });
  } catch (err) {
    console.error('Error getting waitlist position:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
