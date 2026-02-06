const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Initialize with service account if available, otherwise use default
let app;
try {
  const serviceAccount = require('./serviceAccountKey.json');
  app = initializeApp({
    credential: cert(serviceAccount)
  });
} catch (e) {
  // Try application default credentials
  app = initializeApp();
}

const db = getFirestore();
const auth = getAuth();

const EMAIL_TO_DELETE = 'shefundit@gmail.com';

async function deleteUser() {
  try {
    // Find user by email in Firebase Auth
    console.log(`Looking for user with email: ${EMAIL_TO_DELETE}`);
    
    const userRecord = await auth.getUserByEmail(EMAIL_TO_DELETE);
    console.log(`Found user in Auth: ${userRecord.uid}`);
    
    // Delete from Firestore users collection
    const userRef = db.collection('users').doc(userRecord.uid);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      console.log('User profile data:', JSON.stringify(userDoc.data(), null, 2));
      await userRef.delete();
      console.log('✅ Deleted user profile from Firestore');
    } else {
      console.log('No user profile found in Firestore');
    }
    
    // Check for any invitations
    const invitationsSnapshot = await db.collection('invitations')
      .where('email', '==', EMAIL_TO_DELETE.toLowerCase())
      .get();
    
    if (!invitationsSnapshot.empty) {
      console.log(`Found ${invitationsSnapshot.size} invitation(s)`);
      for (const doc of invitationsSnapshot.docs) {
        console.log('Invitation:', JSON.stringify(doc.data(), null, 2));
        await doc.ref.delete();
        console.log(`✅ Deleted invitation ${doc.id}`);
      }
    }
    
    // Delete from Firebase Auth
    await auth.deleteUser(userRecord.uid);
    console.log('✅ Deleted user from Firebase Auth');
    
    console.log('\n🎉 User completely deleted!');
    
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log('User not found in Firebase Auth. Checking Firestore by email...');
      
      // Search Firestore users by email field
      const usersSnapshot = await db.collection('users')
        .where('email', '==', EMAIL_TO_DELETE)
        .get();
      
      if (!usersSnapshot.empty) {
        for (const doc of usersSnapshot.docs) {
          console.log('Found user in Firestore:', doc.id, doc.data());
          await doc.ref.delete();
          console.log(`✅ Deleted user profile ${doc.id}`);
        }
      } else {
        console.log('No user found in Firestore either');
      }
      
      // Still check invitations
      const invitationsSnapshot = await db.collection('invitations')
        .where('email', '==', EMAIL_TO_DELETE.toLowerCase())
        .get();
      
      if (!invitationsSnapshot.empty) {
        for (const doc of invitationsSnapshot.docs) {
          await doc.ref.delete();
          console.log(`✅ Deleted invitation ${doc.id}`);
        }
      }
    } else {
      console.error('Error:', error.message);
    }
  }
  
  process.exit(0);
}

deleteUser();
