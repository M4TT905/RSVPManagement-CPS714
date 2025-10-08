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

app.get('/api/data', async (req, res) => {
  try {
    console.log('Currently trying to access db');
    const snapshot = await db.collection('Events').get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (error) {
    console.error('Error fetching data from Firestore:', error);
    res.status(500).send('Error fetching data');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
