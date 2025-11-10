const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

// Firebase init
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();
const { rsvp } = require('./RSVP');

// helpful global handlers
process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', err => {
  console.error('Unhandled Rejection:', err);
});

// quick Firestore connection test
db.listCollections()
  .then(cols => console.log('Firestore connected, collections:', cols.map(c => c.id)))
  .catch(err => console.error('Firestore connection error:', err));

app.get('/', (req, res) => {
  res.send('API is running. Try GET /api/data or POST /api/rsvp');
});

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

      await rsvp(db, {email, eventID});
      return res.json({ ok: true });
  } catch (err) {
    console.error('Error in /api/rsvp:', err);
    return res.status(500).json({ error: 'Failed to save RSVP' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
