// Setup Admin Profile in Firestore (for existing auth user)
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore'

// Your Firebase config
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

async function setupAdminProfile() {
  console.log('🔧 Setting up Admin Profile in Firestore...\n')
  
  const adminEmail = 'admin@test.com'
  const adminPassword = 'password123'
  
  try {
    console.log('1️⃣ Signing in to get user UID...')
    
    // Sign in to get the user UID
    const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword)
    const user = userCredential.user
    
    console.log(`✅ Successfully signed in!`)
    console.log(`   UID: ${user.uid}`)
    console.log(`   Email: ${user.email}`)
    
    console.log('\n2️⃣ Checking if admin profile already exists...')
    
    // Check if admin profile already exists
    const adminDocRef = doc(db, 'admins', user.uid)
    const adminDoc = await getDoc(adminDocRef)
    
    if (adminDoc.exists()) {
      console.log('ℹ️  Admin profile already exists in Firestore!')
      console.log('   Current profile:', adminDoc.data())
      console.log('\n✅ You should be able to login now!')
    } else {
      console.log('3️⃣ Creating admin profile in Firestore...')
      
      // Create admin profile
      const adminData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Test Admin',
        role: 'admin',
        permissions: ['all'],
        isActive: true,
        createdAt: new Date().toISOString()
      }
      
      await setDoc(adminDocRef, adminData)
      
      console.log(`✅ Admin profile created successfully!`)
      console.log(`   Collection: admins`)
      console.log(`   Document ID: ${user.uid}`)
      console.log('   Profile data:', adminData)
    }
    
    console.log('\n🎉 SUCCESS! Admin setup completed!')
    console.log('\n📋 Login Credentials:')
    console.log(`   Email: ${adminEmail}`)
    console.log(`   Password: ${adminPassword}`)
    console.log('\n🌐 Admin Dashboard: http://localhost:3001')
    console.log('\n✨ You can now login to the admin dashboard!')
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      console.log('\n💡 Login failed. The user might not exist or password is wrong.')
      console.log('   Try creating the user manually in Firebase Console.')
    } else if (error.code === 'auth/too-many-requests') {
      console.log('\n💡 Too many failed login attempts. Wait a moment and try again.')
    } else {
      console.log('\n💡 Make sure:')
      console.log('   - Firebase project is active')
      console.log('   - Authentication is enabled')
      console.log('   - Firestore database is created')
      console.log('   - User exists in Firebase Authentication')
    }
  }
}

// Run the setup
setupAdminProfile().then(() => {
  console.log('\n🏁 Setup completed!')
  process.exit(0)
}).catch((error) => {
  console.error('Setup failed:', error)
  process.exit(1)
})
