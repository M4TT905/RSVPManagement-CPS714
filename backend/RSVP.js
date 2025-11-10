async function RSVP(db, { email, eventID }) {
    async function readEventData(db, eventId) {
        // Get database documents
        const docRef = db.collection('Events').doc(eventId);   // Path: Events/eventId
        const docSnap = await docRef.get();                    // Fetch document

        // Check that the event with eventID exists
        if (!docSnap.exists) {
            console.log('No such event!');
            return null;
        }

        const data = docSnap.data();                           // Read the fields
        console.log('Event data:', data);

        const capacity = data.Capacity;                         // Get the capacity
        const registered = data.Registered;                     // Get the registered count

        console.log(`Capacity: ${capacity}, Registered: ${registered}`);

        return { capacity, registered };
    }
    

    const eventInfo = await readEventData(db, eventId);         // Contains event capacity & registration count
    console.log(eventInfo.capacity, eventInfo.registered);

    if (eventInfo.registered < eventInfo.capacity) {            // If theres space
        // register
        console.log("Registered");
    } else {                                                    // If there isnt
        // waitlist
        console.log("waitlisted");
    }

}