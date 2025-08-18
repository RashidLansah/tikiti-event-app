// Quick script to check what data exists in your Firebase
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBxY-IGHevGAi7tvOGZ9V4VwFhU28zCKQc",
  authDomain: "tikiti-45ac4.firebaseapp.com",
  projectId: "tikiti-45ac4",
  storageBucket: "tikiti-45ac4.firebasestorage.app",
  messagingSenderId: "843705368074",
  appId: "1:843705368074:ios:15f123d0e423a5a0b069f3"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function checkData() {
  console.log('🔍 Checking Firebase data...\n')
  
  try {
    // Check users
    const usersSnapshot = await getDocs(collection(db, 'users'))
    console.log(`👥 USERS: ${usersSnapshot.size} documents`)
    if (usersSnapshot.size > 0) {
      const firstUser = usersSnapshot.docs[0].data()
      console.log('   Sample user:', {
        email: firstUser.email,
        accountType: firstUser.accountType,
        displayName: firstUser.displayName,
        firstName: firstUser.firstName,
        lastName: firstUser.lastName
      })
    }
    
    // Check events  
    const eventsSnapshot = await getDocs(collection(db, 'events'))
    console.log(`\n🎪 EVENTS: ${eventsSnapshot.size} documents`)
    if (eventsSnapshot.size > 0) {
      const firstEvent = eventsSnapshot.docs[0].data()
      console.log('   Sample event:', {
        name: firstEvent.name || firstEvent.title,
        isActive: firstEvent.isActive,
        organizerId: firstEvent.organizerId,
        soldTickets: firstEvent.soldTickets,
        price: firstEvent.price
      })
    }
    
    // Check bookings
    const bookingsSnapshot = await getDocs(collection(db, 'bookings'))
    console.log(`\n🎫 BOOKINGS: ${bookingsSnapshot.size} documents`)
    if (bookingsSnapshot.size > 0) {
      const firstBooking = bookingsSnapshot.docs[0].data()
      console.log('   Sample booking:', {
        status: firstBooking.status,
        totalAmount: firstBooking.totalAmount,
        eventId: firstBooking.eventId,
        userId: firstBooking.userId
      })
    }
    
    // Check categories
    const categoriesSnapshot = await getDocs(collection(db, 'categories'))
    console.log(`\n🏷️ CATEGORIES: ${categoriesSnapshot.size} documents`)
    if (categoriesSnapshot.size > 0) {
      const firstCategory = categoriesSnapshot.docs[0].data()
      console.log('   Sample category:', {
        name: firstCategory.name,
        icon: firstCategory.icon,
        color: firstCategory.color
      })
    }
    
    // Check admins
    const adminsSnapshot = await getDocs(collection(db, 'admins'))
    console.log(`\n👑 ADMINS: ${adminsSnapshot.size} documents`)
    if (adminsSnapshot.size > 0) {
      const firstAdmin = adminsSnapshot.docs[0].data()
      console.log('   Sample admin:', {
        email: firstAdmin.email,
        role: firstAdmin.role,
        displayName: firstAdmin.displayName
      })
    }
    
    console.log('\n✅ Data check completed!')
    console.log('\n📋 Summary:')
    console.log(`   - Users: ${usersSnapshot.size}`)
    console.log(`   - Events: ${eventsSnapshot.size}`)
    console.log(`   - Bookings: ${bookingsSnapshot.size}`)
    console.log(`   - Categories: ${categoriesSnapshot.size}`)
    console.log(`   - Admins: ${adminsSnapshot.size}`)
    
    if (usersSnapshot.size === 0 && eventsSnapshot.size === 0) {
      console.log('\n💡 No data found. This means:')
      console.log('   - No users have registered in your mobile app yet')
      console.log('   - No events have been created yet')
      console.log('   - The admin dashboard will show "No data" messages')
      console.log('   - Once users register and create events, they will appear here!')
    }
    
  } catch (error) {
    console.error('❌ Error checking data:', error)
  }
  
  process.exit(0)
}

checkData()
