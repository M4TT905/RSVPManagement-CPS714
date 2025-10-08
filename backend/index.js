const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// Sample route
app.get('/api/data', async (req, res) => {
  try {
    const snapshot = await db.collection('items').get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (error) {
    console.error('Error fetching data from Firestore:', error);
    res.status(500).send('Error fetching data');
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
