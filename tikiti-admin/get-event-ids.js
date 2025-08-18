import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBxY-IGHevGAi7tvOGZ9V4VwFhU28zCKQc',
  authDomain: 'tikiti-45ac4.firebaseapp.com',
  projectId: 'tikiti-45ac4',
  storageBucket: 'tikiti-45ac4.firebasestorage.app',
  messagingSenderId: '843705368074',
  appId: '1:843705368074:ios:15f123d0e423a5a0b069f3'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function getEventIds() {
  console.log('🔍 Getting event IDs for testing...\n');
  
  const eventsSnapshot = await getDocs(query(collection(db, 'events'), limit(3)));
  const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  console.log('🎪 Test URLs:\n');
  events.forEach((event, index) => {
    const testUrl = `https://tikiti-b343jnb30-lansahs-projects-ff07a47b.vercel.app/events/${event.id}`;
    console.log(`Event ${index + 1}: ${event.name || 'Untitled'}`);
    console.log(`🔗 ${testUrl}`);
    console.log('');
  });
  
  console.log('📋 Instructions:');
  console.log('1. Click any URL above');
  console.log('2. Fill out the RSVP form');
  console.log('3. Click "Download Ticket"');
  console.log('4. Check admin dashboard for the booking');
  
  process.exit(0);
}

getEventIds().catch(console.error);
