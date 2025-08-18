import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  where,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  Timestamp 
} from 'firebase/firestore'
import { db } from '../lib/firebase'

export interface DashboardStats {
  totalUsers: number
  activeEvents: number
  totalRevenue: number
  pendingApprovals: number
  activeUsers24h: number
  featuredEvents: any[]
  topOrganizers: any[]
  apiResponseTime: string
}

export interface RecentActivity {
  id: string
  type: 'user_registered' | 'event_created' | 'ticket_purchased' | 'event_approved'
  description: string
  timestamp: Date
  userId?: string
  eventId?: string
}

export interface AnalyticsData {
  userGrowth: Array<{ date: string; users: number }>
  eventCreation: Array<{ date: string; events: number }>
  revenue: Array<{ date: string; revenue: number }>
}

class AdminService {
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      console.log('🔍 Fetching real data from Firebase...')

      // Get total users
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const totalUsers = usersSnapshot.size
      console.log(`📊 Total users: ${totalUsers}`)

      // Get all events
      const eventsSnapshot = await getDocs(collection(db, 'events'))
      const allEvents = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      
      // Get active events
      const activeEvents = allEvents.filter((event: any) => event.isActive === true).length
      console.log(`📊 Active events: ${activeEvents}`)

      // Get pending events (events without status or with pending status)
      const pendingApprovals = allEvents.filter((event: any) => 
        !event.status || event.status === 'pending'
      ).length
      console.log(`📊 Pending approvals: ${pendingApprovals}`)

      // Calculate total revenue from bookings
      let totalRevenue = 0
      const bookingsSnapshot = await getDocs(collection(db, 'bookings'))
      bookingsSnapshot.forEach(doc => {
        const booking = doc.data()
        if (booking.status === 'confirmed' && booking.totalAmount) {
          totalRevenue += booking.totalAmount
        }
      })
      console.log(`📊 Total revenue: ₵${totalRevenue}`)

      // Get featured events
      const featuredEvents = allEvents.filter((event: any) => event.featured === true).slice(0, 5)
      console.log(`📊 Featured events: ${featuredEvents.length}`)

      // Get top organizers (users with accountType 'organizer')
      const organizerUsers = []
      usersSnapshot.forEach(doc => {
        const user = doc.data()
        if (user.accountType === 'organizer') {
          const organizerEvents = allEvents.filter((event: any) => event.organizerId === doc.id)
          const organizerRevenue = organizerEvents.reduce((sum: number, event: any) => 
            sum + (event.soldTickets || 0) * (event.price || 0), 0)
          
          organizerUsers.push({
            id: doc.id,
            name: user.displayName || `${user.firstName} ${user.lastName}` || user.email,
            eventsCount: organizerEvents.length,
            revenue: organizerRevenue
          })
        }
      })
      
      // Sort by revenue and get top 5
      const topOrganizers = organizerUsers
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      // Calculate active users (estimate based on recent activity)
      const activeUsers24h = Math.floor(totalUsers * 0.25) // 25% assumed active

      const stats: DashboardStats = {
        totalUsers,
        activeEvents,
        totalRevenue,
        pendingApprovals,
        activeUsers24h,
        apiResponseTime: '< 100ms',
        featuredEvents: featuredEvents.map((event: any) => ({
          id: event.id,
          name: event.name || event.title,
          organizer: event.organizerName || 'Unknown',
          ticketsSold: event.soldTickets || 0
        })),
        topOrganizers
      }

      console.log('✅ Real Firebase data loaded:', stats)
      return stats
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      
      // Fallback to basic stats if there's an error
      return {
        totalUsers: 0,
        activeEvents: 0,
        totalRevenue: 0,
        pendingApprovals: 0,
        activeUsers24h: 0,
        apiResponseTime: 'Error',
        featuredEvents: [],
        topOrganizers: []
      }
    }
  }

  async getRecentActivity(): Promise<RecentActivity[]> {
    try {
      console.log('🔍 Fetching recent activity from Firebase...')
      const activities: RecentActivity[] = []

      // Get recent users (last 10)
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'))
        const recentUsers = usersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((user: any) => user.createdAt)
          .sort((a: any, b: any) => {
            const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt)
            const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt)
            return bTime.getTime() - aTime.getTime()
          })
          .slice(0, 5)

        recentUsers.forEach((user: any, index) => {
          const timestamp = user.createdAt?.toDate?.() || new Date(user.createdAt)
          activities.push({
            id: `user-${user.id}`,
            type: 'user_registered',
            description: `New ${user.accountType || 'user'} registered: ${user.email}`,
            timestamp,
            userId: user.id
          })
        })
      } catch (error) {
        console.log('⚠️ Could not fetch recent users:', error.message)
      }

      // Get recent events (last 5)
      try {
        const eventsSnapshot = await getDocs(collection(db, 'events'))
        const recentEvents = eventsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((event: any) => event.createdAt)
          .sort((a: any, b: any) => {
            const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt)
            const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt)
            return bTime.getTime() - aTime.getTime()
          })
          .slice(0, 3)

        recentEvents.forEach((event: any) => {
          const timestamp = event.createdAt?.toDate?.() || new Date(event.createdAt)
          activities.push({
            id: `event-${event.id}`,
            type: 'event_created',
            description: `New event created: "${event.name || event.title}"`,
            timestamp,
            eventId: event.id
          })
        })
      } catch (error) {
        console.log('⚠️ Could not fetch recent events:', error.message)
      }

      // Get recent bookings (last 5)
      try {
        const bookingsSnapshot = await getDocs(collection(db, 'bookings'))
        const recentBookings = bookingsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((booking: any) => booking.createdAt && booking.status === 'confirmed')
          .sort((a: any, b: any) => {
            const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt)
            const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt)
            return bTime.getTime() - aTime.getTime()
          })
          .slice(0, 3)

        recentBookings.forEach((booking: any) => {
          const timestamp = booking.createdAt?.toDate?.() || new Date(booking.createdAt)
          activities.push({
            id: `booking-${booking.id}`,
            type: 'ticket_purchased',
            description: `Ticket purchased for event (₵${booking.totalAmount || 0})`,
            timestamp,
            eventId: booking.eventId
          })
        })
      } catch (error) {
        console.log('⚠️ Could not fetch recent bookings:', error.message)
      }

      // Sort all activities by timestamp (most recent first)
      const sortedActivities = activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10) // Keep only the 10 most recent

      console.log(`✅ Loaded ${sortedActivities.length} recent activities`)
      return sortedActivities

    } catch (error) {
      console.error('Error fetching recent activity:', error)
      
      // Return empty array if there's an error
      return []
    }
  }

  async getAnalyticsOverview(): Promise<AnalyticsData> {
    try {
      // Generate mock analytics data for the past 30 days
      const days = 30
      const today = new Date()
      
      const userGrowth = []
      const eventCreation = []
      const revenue = []

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]

        userGrowth.push({
          date: dateStr,
          users: Math.floor(Math.random() * 50) + 10 // Random between 10-60
        })

        eventCreation.push({
          date: dateStr,
          events: Math.floor(Math.random() * 8) + 1 // Random between 1-8
        })

        revenue.push({
          date: dateStr,
          revenue: Math.floor(Math.random() * 5000) + 1000 // Random between 1000-6000
        })
      }

      return {
        userGrowth,
        eventCreation,
        revenue
      }
    } catch (error) {
      console.error('Error fetching analytics overview:', error)
      throw error
    }
  }

  async getUsers(limit = 50) {
    try {
      console.log('🔍 Fetching real users from Firebase...')
      
      // Try with ordering first
      try {
        const usersQuery = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc'),
          limit(limit)
        )
        const snapshot = await getDocs(usersQuery)
        const users = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        console.log(`📊 Loaded ${users.length} users with ordering`)
        return users
      } catch (orderError) {
        // If ordering fails (index not created), get all users
        console.log('⚠️ Ordering failed, fetching all users...')
        const snapshot = await getDocs(collection(db, 'users'))
        const users = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).slice(0, limit)
        console.log(`📊 Loaded ${users.length} users without ordering`)
        return users
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  }

  async getEvents(limit = 50, organizerId?: string) {
    try {
      console.log('🔍 Fetching real events from Firebase...')
      
      // Try with ordering first
      try {
        let eventsQuery = query(
          collection(db, 'events'),
          orderBy('createdAt', 'desc'),
          limit(limit)
        )
        
        // Add organizer filter if provided
        if (organizerId) {
          eventsQuery = query(
            collection(db, 'events'),
            where('organizerId', '==', organizerId),
            orderBy('createdAt', 'desc'),
            limit(limit)
          )
        }
        
        const snapshot = await getDocs(eventsQuery)
        const events = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        // Auto-approve all events that don't have a status
        const unapprovedEvents = events.filter(event => !event.status || event.status === 'pending')
        if (unapprovedEvents.length > 0) {
          console.log(`🔄 Auto-approving ${unapprovedEvents.length} events...`)
          await Promise.all(
            unapprovedEvents.map(event => 
              this.updateEvent(event.id, { 
                status: 'approved', 
                isActive: true,
                approvedAt: Timestamp.now(),
                autoApproved: true
              })
            )
          )
          // Update the events array with approved status
          unapprovedEvents.forEach(event => {
            event.status = 'approved'
            event.isActive = true
            event.autoApproved = true
          })
        }
        
        console.log(`📊 Loaded ${events.length} events with ordering`)
        return events
      } catch (orderError) {
        // If ordering fails (index not created), get all events
        console.log('⚠️ Ordering failed, fetching all events...')
        let snapshot
        if (organizerId) {
          snapshot = await getDocs(query(collection(db, 'events'), where('organizerId', '==', organizerId)))
        } else {
          snapshot = await getDocs(collection(db, 'events'))
        }
        
        const events = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).slice(0, limit)
        
        // Auto-approve all events that don't have a status
        const unapprovedEvents = events.filter(event => !event.status || event.status === 'pending')
        if (unapprovedEvents.length > 0) {
          console.log(`🔄 Auto-approving ${unapprovedEvents.length} events...`)
          await Promise.all(
            unapprovedEvents.map(event => 
              this.updateEvent(event.id, { 
                status: 'approved', 
                isActive: true,
                approvedAt: Timestamp.now(),
                autoApproved: true
              })
            )
          )
          // Update the events array with approved status
          unapprovedEvents.forEach(event => {
            event.status = 'approved'
            event.isActive = true
            event.autoApproved = true
          })
        }
        
        console.log(`📊 Loaded ${events.length} events without ordering`)
        return events
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      throw error
    }
  }

  async updateUser(userId: string, updates: any) {
    try {
      const userRef = doc(db, 'users', userId)
      await updateDoc(userRef, {
        ...updates,
        updatedAt: Timestamp.now()
      })
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  async updateEvent(eventId: string, updates: any) {
    try {
      const eventRef = doc(db, 'events', eventId)
      await updateDoc(eventRef, {
        ...updates,
        updatedAt: Timestamp.now()
      })
    } catch (error) {
      console.error('Error updating event:', error)
      throw error
    }
  }

  async deleteUser(userId: string) {
    try {
      await deleteDoc(doc(db, 'users', userId))
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }

  async approveEvent(eventId: string) {
    console.log(`✅ Approving event: ${eventId}`)
    return this.updateEvent(eventId, { 
      status: 'approved', 
      isActive: true,
      approvedAt: Timestamp.now()
    })
  }

  async rejectEvent(eventId: string, reason?: string) {
    console.log(`❌ Rejecting event: ${eventId}`)
    return this.updateEvent(eventId, { 
      status: 'rejected', 
      isActive: false,
      rejectionReason: reason,
      rejectedAt: Timestamp.now()
    })
  }

  async featureEvent(eventId: string, featured: boolean) {
    console.log(`⭐ ${featured ? 'Featuring' : 'Unfeaturing'} event: ${eventId}`)
    return this.updateEvent(eventId, { 
      featured,
      featuredAt: featured ? Timestamp.now() : null
    })
  }

  // Get all organizers for filtering
  async getOrganizers() {
    try {
      console.log('🔍 Fetching organizers...')
      const usersSnapshot = await getDocs(
        query(collection(db, 'users'), where('userType', '==', 'organiser'))
      )
      const organizers = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      console.log(`📊 Found ${organizers.length} organizers`)
      return organizers
    } catch (error) {
      console.error('Error fetching organizers:', error)
      // Fallback: get all users and filter
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'))
        const organizers = usersSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => user.userType === 'organiser' || user.userType === 'organizer')
        console.log(`📊 Found ${organizers.length} organizers (fallback)`)
        return organizers
      } catch (fallbackError) {
        console.error('Error in organizers fallback:', fallbackError)
        return []
      }
    }
  }

  // Get detailed event information with attendees
  async getEventDetails(eventId: string) {
    try {
      console.log(`🔍 Fetching details for event: ${eventId}`)
      
      // Get event data
      const eventDoc = await getDoc(doc(db, 'events', eventId))
      if (!eventDoc.exists()) {
        throw new Error('Event not found')
      }
      
      const eventData = { id: eventDoc.id, ...eventDoc.data() }
      
      // Get organizer data
      let organizer = null
      if (eventData.organizerId) {
        try {
          const organizerDoc = await getDoc(doc(db, 'users', eventData.organizerId))
          if (organizerDoc.exists()) {
            organizer = { id: organizerDoc.id, ...organizerDoc.data() }
          }
        } catch (error) {
          console.warn('Could not fetch organizer data:', error)
        }
      }
      
      // Get bookings/tickets for this event
      let attendees = []
      let bookingStats = {
        totalBookings: 0,
        totalRevenue: 0,
        attendeeCount: 0,
        rsvpCount: 0
      }
      
      try {
        const bookingsSnapshot = await getDocs(
          query(collection(db, 'bookings'), where('eventId', '==', eventId))
        )
        
        const bookings = bookingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        bookingStats.totalBookings = bookings.length
        bookingStats.totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalAmount || booking.price || 0), 0)
        
        // Get attendee details
        const attendeePromises = bookings.map(async (booking) => {
          // Check if this is a web booking (has userEmail/userName directly or userId starts with 'web_')
          const isWebBooking = booking.source === 'web' || 
                              booking.userId?.startsWith('web_') || 
                              (booking.userEmail && booking.userName)
          
          if (isWebBooking) {
            // For web bookings, use the data stored directly in the booking
            return {
              bookingId: booking.id,
              userId: booking.userId,
              userName: booking.userName || `${booking.firstName || ''} ${booking.lastName || ''}`.trim() || 'Web User',
              userEmail: booking.userEmail || booking.email || 'No email provided',
              bookingDate: booking.createdAt,
              ticketQuantity: booking.quantity || booking.ticketQuantity || 1,
              totalAmount: booking.totalPrice || booking.totalAmount || booking.price || 0,
              status: booking.status || 'confirmed',
              paymentMethod: booking.paymentMethod || 'web',
              // Additional web booking details
              firstName: booking.firstName,
              lastName: booking.lastName,
              phoneNumber: booking.phoneNumber,
              gender: booking.gender,
              source: 'web',
              registrationType: booking.registrationType || 'rsvp'
            }
          } else {
            // For mobile app bookings, try to fetch user details from users collection
            try {
              const userDoc = await getDoc(doc(db, 'users', booking.userId))
              return {
                bookingId: booking.id,
                userId: booking.userId,
                userName: userDoc.exists() ? userDoc.data().name || userDoc.data().email : 'Mobile User',
                userEmail: userDoc.exists() ? userDoc.data().email : 'No email',
                bookingDate: booking.createdAt,
                ticketQuantity: booking.ticketQuantity || booking.quantity || 1,
                totalAmount: booking.totalAmount || booking.price || 0,
                status: booking.status || 'confirmed',
                paymentMethod: booking.paymentMethod || 'mobile',
                source: 'mobile'
              }
            } catch (error) {
              console.warn('Could not fetch user data for booking:', booking.id)
              return {
                bookingId: booking.id,
                userId: booking.userId,
                userName: 'Mobile User',
                userEmail: 'No email',
                bookingDate: booking.createdAt,
                ticketQuantity: booking.ticketQuantity || booking.quantity || 1,
                totalAmount: booking.totalAmount || booking.price || 0,
                status: booking.status || 'confirmed',
                paymentMethod: booking.paymentMethod || 'unknown',
                source: 'mobile'
              }
            }
          }
        })
        
        attendees = await Promise.all(attendeePromises)
        bookingStats.attendeeCount = attendees.reduce((sum, attendee) => sum + attendee.ticketQuantity, 0)
        
      } catch (error) {
        console.warn('Could not fetch bookings data:', error)
      }
      
      console.log(`📊 Event details loaded: ${attendees.length} bookings, ${bookingStats.attendeeCount} attendees`)
      
      return {
        ...eventData,
        organizer,
        attendees,
        bookingStats
      }
    } catch (error) {
      console.error('Error fetching event details:', error)
      throw error
    }
  }
}

export const adminService = new AdminService()
