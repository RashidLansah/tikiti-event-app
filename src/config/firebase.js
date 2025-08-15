import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Firebase configuration from GoogleService-Info.plist
const firebaseConfig = {
  apiKey: "AIzaSyBxY-IGHevGAi7tvOGZ9V4VwFhU28zCKQc",
  authDomain: "tikiti-45ac4.firebaseapp.com",
  projectId: "tikiti-45ac4",
  storageBucket: "tikiti-45ac4.firebasestorage.app",
  messagingSenderId: "843705368074",
  appId: "1:843705368074:ios:15f123d0e423a5a0b069f3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { auth, db, storage };
export default app;