// Firebase Admin SDK for server-side operations (API routes)
import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let adminApp: App;
let adminDb: Firestore;

function getAdminApp(): App {
  if (!getApps().length) {
    // Try service account JSON first, then fall back to individual env vars
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccount) {
      try {
        const parsed = JSON.parse(serviceAccount);
        adminApp = initializeApp({
          credential: cert(parsed),
        });
      } catch {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY');
        // Fall back to project ID only (works in Firebase-hosted environments)
        adminApp = initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'tikiti-45ac4',
        });
      }
    } else {
      // Fall back to default credentials or project ID
      // This works in Firebase/GCP hosted environments with default service account
      adminApp = initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'tikiti-45ac4',
      });
    }
  } else {
    adminApp = getApps()[0];
  }

  return adminApp;
}

export function getAdminFirestore(): Firestore {
  if (!adminDb) {
    const app = getAdminApp();
    adminDb = getFirestore(app);
  }
  return adminDb;
}
