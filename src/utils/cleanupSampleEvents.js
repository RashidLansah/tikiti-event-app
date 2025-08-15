import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

// Function to delete sample events from the database
export const cleanupSampleEvents = async () => {
  try {
    console.log('🧹 Cleaning up sample events from database...');
    
    const eventsRef = collection(db, 'events');
    
    // Get all events with demo organizer ID or specific sample event names
    const sampleEventNames = [
      'Tech Conference 2024',
      'Jazz Night at the Park', 
      'Food & Wine Festival',
      'Yoga Workshop: Mind & Body',
      'Art Gallery Opening',
      'Northern Music Festival',
      'Tech Innovation Summit',
      'Traditional Arts Exhibition',
      'Food Festival Tamale',
      'Comedy Night Tamale'
    ];
    
    // Query for events with demo organizer ID
    const demoOrganizerQuery = query(eventsRef, where('organizerId', '==', 'demo-organizer-123'));
    const demoQuerySnapshot = await getDocs(demoOrganizerQuery);
    
    let deletedCount = 0;
    
    // Delete demo organizer events
    for (const docSnapshot of demoQuerySnapshot.docs) {
      await deleteDoc(doc(db, 'events', docSnapshot.id));
      deletedCount++;
      console.log(`✅ Deleted demo event: ${docSnapshot.data().name}`);
    }
    
    // Also query for events by name (in case they have different organizer IDs)
    for (const eventName of sampleEventNames) {
      const nameQuery = query(eventsRef, where('name', '==', eventName));
      const nameQuerySnapshot = await getDocs(nameQuery);
      
      for (const docSnapshot of nameQuerySnapshot.docs) {
        await deleteDoc(doc(db, 'events', docSnapshot.id));
        deletedCount++;
        console.log(`✅ Deleted sample event by name: ${eventName}`);
      }
    }
    
    console.log(`🎉 Cleanup complete! Deleted ${deletedCount} sample events.`);
    return deletedCount;
    
  } catch (error) {
    console.error('❌ Error cleaning up sample events:', error);
    throw error;
  }
};
