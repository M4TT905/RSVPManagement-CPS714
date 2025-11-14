

const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());


// Firebase setup
// Connects the backend to Firestore using the Firebase admin SDK
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();


// Route imports
// The RSVP routes were originally here from the main project
const { rsvp } = require('./RSVP');

// Added by me(Olamide): new waitlist routes ( RSVP & Waitlist)
// These handle automatic waitlist management when an event is full
const waitlistRoutes = require('./waitlistRoutes');


// Error handling for crashes
// -------------------------------
process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', err => {
  console.error('Unhandled Rejection:', err);
});


// Test Firestore connection
// This just confirms that the backend is connected to the database
db.listCollections()
  .then(cols => console.log('Firestore connected, collections:', cols.map(c => c.id)))
  .catch(err => console.error('Firestore connection error:', err));


// Base route check
// Visiting http://localhost:5050/ should show a simple message so we know so far so good
app.get('/', (req, res) => {
  res.send('API is running. Try GET /api/data or POST /api/rsvp');
});

// -------------------------------
// Existing RSVP routes (from original code)
// -------------------------------
app.get('/api/data', async (req, res) => {
  try {
    console.log('Currently trying to access db');
    const snapshot = await db.collection('RSVP').get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (error) {
    console.error('Error fetching data from Firestore:', error);
    res.status(500).send('Error fetching data');
  }
});

app.post('/api/rsvp', async (req, res) => {
  try {
    const { email, eventID } = req.body;
    if (!email || !eventID) {
      return res.status(400).json({ error: 'eventId and email are required' });
    }

    await RSVP(db, { email, eventID });
    return res.json({ ok: true });
  } catch (err) {
    console.error('Error in /api/rsvp:', err);
    return res.status(500).json({ error: 'Failed to save RSVP' });
  }
});


//Cancel RSVP
app.post('/api/rsvp/cancel', async (req, res) => {
  try {
    const { email, eventID } = req.body;

    if (!email || !eventID) {
      return res.status(400).json({ ok: false, error: 'eventId and email are required' });
    }

    await cancelRSVP(db, { email, eventID });
    return res.json({ ok: true });
  } catch (err) {
    console.error('Error in /api/rsvp:', err);
    return res.status(500).json({ error: 'Failed to save RSVP' });
  }
});

// Added by me(Olamide): Waitlist system routes
// This connects to waitlistRoutes.js, which handles:
// - Adding users to the waitlist when an event is full
// - Promoting users when a spot opens
// - Checking waitlist positions
app.use('/', waitlistRoutes);


// Start the server

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
