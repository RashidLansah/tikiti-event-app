// Server-side Firebase configuration for API routes
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBxY-IGHevGAi7tvOGZ9V4VwFhU28zCKQc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "tikiti-45ac4.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "tikiti-45ac4",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "tikiti-45ac4.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "843705368074",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:843705368074:web:15f123d0e423a5a0b069f3"
};

// Initialize Firebase for server-side usage
let serverApp: FirebaseApp;
let serverDb: Firestore;

// Server-side initialization (always runs)
if (!getApps().length) {
  serverApp = initializeApp(firebaseConfig);
} else {
  serverApp = getApps()[0];
}

serverDb = getFirestore(serverApp);

export { serverApp, serverDb };
