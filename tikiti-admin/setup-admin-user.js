// Automated Admin User Setup Script for Tikiti Admin Dashboard
import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { getFirestore, doc, setDoc } from 'firebase/firestore'

// Your Firebase config (from .env file)
const firebaseConfig = {
  apiKey: "AIzaSyBxY-IGHevGAi7tvOGZ9V4VwFhU28zCKQc",
  authDomain: "tikiti-45ac4.firebaseapp.com",
  projectId: "tikiti-45ac4",
  storageBucket: "tikiti-45ac4.firebasestorage.app",
  messagingSenderId: "843705368074",
  appId: "1:843705368074:ios:15f123d0e423a5a0b069f3"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

async function createAdminUser() {
  console.log('🚀 Setting up Tikiti Admin User...\n')
  
  const adminEmail = 'admin@test.com'
  const adminPassword = 'password123'
  const adminDisplayName = 'Test Admin'
  
  try {
    console.log('1️⃣ Creating Firebase Authentication user...')
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword)
    const user = userCredential.user
    
    console.log(`✅ Auth user created successfully!`)
    console.log(`   UID: ${user.uid}`)
    console.log(`   Email: ${user.email}`)
    
    // Update display name
    await updateProfile(user, {
      displayName: adminDisplayName
    })
    
    console.log('\n2️⃣ Creating admin profile in Firestore...')
    
    // Create admin profile in Firestore
    const adminData = {
      uid: user.uid,
      email: user.email,
      displayName: adminDisplayName,
      role: 'admin',
      permissions: ['all'],
      isActive: true,
      createdAt: new Date().toISOString()
    }
    
    await setDoc(doc(db, 'admins', user.uid), adminData)
    
    console.log(`✅ Admin profile created in Firestore!`)
    console.log(`   Collection: admins`)
    console.log(`   Document ID: ${user.uid}`)
    
    console.log('\n🎉 SUCCESS! Admin user setup completed!')
    console.log('\n📋 Login Credentials:')
    console.log(`   Email: ${adminEmail}`)
    console.log(`   Password: ${adminPassword}`)
    console.log('\n🌐 Admin Dashboard: http://localhost:3001')
    console.log('\n⚠️  IMPORTANT: Change the password after first login!')
    
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message)
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('\n💡 The email is already in use. This could mean:')
      console.log('   - Admin user already exists')
      console.log('   - Try logging in with: admin@test.com / password123')
      console.log('   - Or use a different email address')
    } else if (error.code === 'auth/weak-password') {
      console.log('\n💡 Password is too weak. Use a stronger password.')
    } else if (error.code === 'auth/invalid-email') {
      console.log('\n💡 Invalid email format.')
    } else {
      console.log('\n💡 Make sure:')
      console.log('   - Firebase project is active')
      console.log('   - Authentication is enabled in Firebase Console')
      console.log('   - Firestore database is created')
    }
  }
}

// Run the setup
createAdminUser().then(() => {
  console.log('\n✨ Setup script completed!')
  process.exit(0)
}).catch((error) => {
  console.error('Setup failed:', error)
  process.exit(1)
})
