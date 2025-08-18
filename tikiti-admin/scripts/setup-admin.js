/**
 * Script to create admin users in Firebase
 * Run this script to set up initial admin accounts
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc } from 'firebase/firestore'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'

// Your Firebase config (same as mobile app)
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: "your_api_key",
  authDomain: "your_project.firebaseapp.com",
  projectId: "your_project_id",
  storageBucket: "your_project.appspot.com",
  messagingSenderId: "your_sender_id",
  appId: "your_app_id"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

/**
 * Create an admin user
 */
async function createAdminUser(email, password, displayName, role = 'admin') {
  try {
    console.log(`Creating admin user: ${email}`)
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user
    
    // Create admin profile in Firestore
    const adminData = {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      role: role, // 'admin' or 'super_admin'
      permissions: role === 'super_admin' 
        ? ['all'] 
        : ['users:read', 'users:write', 'events:read', 'events:write', 'analytics:read'],
      createdAt: new Date(),
      isActive: true,
      lastLogin: null
    }
    
    await setDoc(doc(db, 'admins', user.uid), adminData)
    
    console.log(`✅ Admin user created successfully: ${email}`)
    console.log(`   UID: ${user.uid}`)
    console.log(`   Role: ${role}`)
    
    return user
  } catch (error) {
    console.error(`❌ Error creating admin user: ${error.message}`)
    throw error
  }
}

/**
 * Setup initial admin users
 */
async function setupAdmins() {
  console.log('🚀 Setting up Tikiti Admin Dashboard...\n')
  
  try {
    // Create super admin
    await createAdminUser(
      'admin@tikiti.com',
      'SecurePassword123!',
      'Super Admin',
      'super_admin'
    )
    
    // Create regular admin
    await createAdminUser(
      'moderator@tikiti.com',
      'ModeratorPass123!',
      'Content Moderator',
      'admin'
    )
    
    console.log('\n✅ Admin setup completed!')
    console.log('\n📋 Login Credentials:')
    console.log('   Super Admin: admin@tikiti.com / SecurePassword123!')
    console.log('   Moderator: moderator@tikiti.com / ModeratorPass123!')
    console.log('\n⚠️  IMPORTANT: Change these passwords after first login!')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

// Run setup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupAdmins()
}

export { createAdminUser, setupAdmins }
