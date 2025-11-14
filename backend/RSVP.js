const admin = require('firebase-admin');

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

        return { capacity, registered, docRef };
    }
    
    if (!email || !eventID){
        return { ok: false, error: 'Missing email or eventID' };
    }

    const eventInfo = await readEventData(eventID);         // Contains event capacity & registration count

    if (!eventInfo){
        return { ok: false, error: 'Event not found' };
    }
    console.log(eventInfo.capacity, eventInfo.registered);


    const rsvpRef = db.collection('RSVP').doc('${eventID}_${email}');
    const existingRSVP = await rsvpRef.get();

    if (existingRSVP.exists) {
        const data = existingRSVP.data();
    

        return {
            ok: true,
            status: 'alreadyregistered',
            message: 'You are already RSVPd for this event.',
            existingRegistration: data.status,
        }
    }



    if (eventInfo.registered < eventInfo.capacity) {            // If theres space
        // register
        console.log("Registered");

        await eventInfo.docRef.update({
            Registered: eventInfo.registered + 1,
        });

        await rsvpRef.set({
            email,
            eventID,
            status:'confirmed',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })

        return{
            ok: true,
            status: 'confirmed',
            message: 'RSVP successful.',
        }
    } else {                                                    // If there isnt
        // waitlist
        console.log("waitlisted");

        return {
            ok: true,
            status: 'full',
            message: 'Event is full. Join the Waitlist',
        }

    }

}

//Cancel RSVP
async function cancelRSVP(db,{email, eventID}) {

    if (!email || !eventID) {
    return { ok: false, error: 'Missing email or eventID' };
    }

    const eventRef = db.collection('Events').doc(eventID);              //Get capacity and registered
    const rsvpRef = db.collection('RSVP').doc(`${eventID}_${email}`);   //Get RSVP EventID and emails

    //Check if RSVP exists
    const rsvpSnap = await rsvpRef.get();

    if (!rsvpSnap.exists) {
    return {
        ok: false,
        status: 'notfound',
        message: 'User is not RSVPd',
    };
    }


    //if its confirmed, decrement it from the registration count
    const rsvpData = rsvpSnap.data();
    const currentStatus = rsvpData.status || 'confirmed';

    if (currentStatus === 'confirmed') {
        const eventSnap = await eventRef.get();

        if (eventSnap.exists) {
            const eventData = eventSnap.data();
            const registered = eventData.Registered || 0;


            const newRegistered = registered > 0 ? registered - 1 : 0;

            await eventRef.update({ Registered: newRegistered})
        }
    }

    await rsvpRef.delete();

    return {
        ok: true,
        status: 'cancelled',
        message: 'RSVP has been cancelled.',
        previousStatus: currentStatus,
    };

}

module.exports = {RSVP, cancelRSVP};