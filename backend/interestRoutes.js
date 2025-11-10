// backend/routes/interestRoutes.js
const express = require('express');
const router = express.Router();
const interestController = require('../controllers/interestController');
const auth = require('../middleware/auth'); // From Sub-project 1: Role-based auth

// Toggle interest (POST)
router.post('/events/:id/interest', auth, interestController.toggleInterest);

// Get status & count (GET)
router.get('/events/:id/interest', auth, interestController.getInterestStatus);

module.exports = router;
