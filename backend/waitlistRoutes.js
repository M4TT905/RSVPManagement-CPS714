// This file defines all the REST API routes related to the
// Waitlist Management System for the RSVP module (Sub-Project 5).
// It connects incoming HTTP requests to the controller functions
// that handle the main business logic (in waitlistController.js).
// ---------------------------------------------


const express = require('express');  
const router = express.Router();
const waitlistController = require('./waitlistController');

// When a user tries to RSVP for an event
// If the event is full, they get added to the waitlist (FIFO order)
router.post('/api/waitlist/rsvp', waitlistController.handleRSVP);

// When a user cancels their RSVP
// The next person on the waitlist automatically moves up
router.post('/api/waitlist/cancel', waitlistController.cancelRSVP);

// Lets a user check their current waitlist position for an event
router.get('/api/waitlist/position', waitlistController.getWaitlistPosition);

// Exports the routes so index.js can use them
module.exports = router;
