// Bootstrap first admin user using Firebase Admin SDK (bypasses Firestore rules)
import admin from 'firebase-admin';

// Initialize with default credentials (uses GOOGLE_APPLICATION_CREDENTIALS or gcloud CLI)
admin.initializeApp({
  projectId: 'tikiti-45ac4',
});

const db = admin.firestore();

async function bootstrapAdmin() {
  const adminEmail = 'admin@test.com';
  const uid = 'XEYvKD0zwDaDgNk8wLKlFHN4Ym92';

  console.log('Creating admin document in Firestore...');

  await db.collection('admins').doc(uid).set({
    uid: uid,
    email: adminEmail,
    displayName: 'Test Admin',
    role: 'super_admin',
    permissions: ['all'],
    isActive: true,
    createdAt: new Date().toISOString(),
  });

  console.log('Admin document created successfully!');
  console.log('\nLogin credentials:');
  console.log('  Email: admin@test.com');
  console.log('  Password: password123');
  console.log('\nDashboard: http://localhost:3001');
  process.exit(0);
}

bootstrapAdmin().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
