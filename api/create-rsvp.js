// Vercel function to handle RSVP creation with validation
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { eventId, userEmail, userName, userPhone, quantity = 1, source = 'web' } = req.body;

    // Validate required fields
    if (!eventId || !userEmail || !userName) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Please provide event ID, email, and name.' 
      });
    }

    // Import Firebase functions
    const { initializeApp } = await import('firebase/app');
    const { getFirestore, collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc, increment, serverTimestamp } = await import('firebase/firestore');

    // Initialize Firebase (you may need to adjust this based on your setup)
    const firebaseConfig = {
      // Your Firebase config here
    };
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Check for duplicate email for this event
    const rsvpsRef = collection(db, 'rsvps');
    const duplicateQuery = query(
      rsvpsRef, 
      where('eventId', '==', eventId),
      where('userEmail', '==', userEmail)
    );
    const existingRSVPs = await getDocs(duplicateQuery);
    
    if (!existingRSVPs.empty) {
      return res.status(400).json({ 
        error: 'Duplicate registration',
        message: 'You have already registered for this event with this email address.' 
      });
    }
    
    // Check if event has available spots
    const eventRef = doc(db, 'events', eventId);
    const eventSnap = await getDoc(eventRef);
    
    if (!eventSnap.exists()) {
      return res.status(404).json({ 
        error: 'Event not found',
        message: 'The requested event could not be found.' 
      });
    }
    
    const eventData = eventSnap.data();
    
    // Check if event is active
    if (eventData.status !== 'active' && eventData.isActive !== true) {
      return res.status(400).json({ 
        error: 'Event not accepting registrations',
        message: 'This event is no longer accepting registrations.' 
      });
    }
    
    // Check if there are enough available tickets
    if (eventData.availableTickets < quantity) {
      return res.status(400).json({ 
        error: 'Event full',
        message: `Only ${eventData.availableTickets} spots remaining. Cannot register for ${quantity} tickets.` 
      });
    }
    
    // Create RSVP
    const rsvpData = {
      eventId,
      userEmail,
      userName,
      userPhone: userPhone || '',
      quantity,
      source,
      status: 'confirmed',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      rsvpReference: `RSVP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    };
    
    const docRef = await addDoc(rsvpsRef, rsvpData);

    // Update event ticket count
    await updateDoc(eventRef, {
      soldTickets: increment(quantity),
      availableTickets: increment(-quantity),
    });

    console.log('✅ RSVP created successfully:', docRef.id);

    res.status(200).json({ 
      success: true, 
      rsvpId: docRef.id,
      message: 'RSVP submitted successfully!' 
    });

  } catch (error) {
    console.error('❌ Error creating RSVP:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'permission-denied') {
      return res.status(403).json({ 
        error: 'Permission denied',
        message: 'Unable to process registration. Please try again.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later.' 
    });
  }
}
