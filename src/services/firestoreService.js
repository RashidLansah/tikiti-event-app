import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  onSnapshot,
  serverTimestamp,
  increment,
  setDoc 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { emailService } from '../config/emailService';

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  EVENTS: 'events',
  TICKETS: 'tickets',
  BOOKINGS: 'bookings',
  CATEGORIES: 'categories'
};

// User Management
export const userService = {
  // Create user profile
  createProfile: async (userId, profileData) => {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await setDoc(userRef, {
        ...profileData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return userRef;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  },

  // Get user profile
  getProfile: async (userId) => {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (userId, updates) => {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
};

// Event Management
export const eventService = {
  // Create event
  create: async (eventData, organizerId) => {
    try {
      const eventsRef = collection(db, COLLECTIONS.EVENTS);
      const docRef = await addDoc(eventsRef, {
        ...eventData,
        organizerId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true,
        soldTickets: 0,
        availableTickets: eventData.totalTickets || 0,
      });
      return docRef;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  // Get single event
  getById: async (eventId) => {
    try {
      const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
      const eventSnap = await getDoc(eventRef);
      
      if (eventSnap.exists()) {
        return { id: eventSnap.id, ...eventSnap.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting event:', error);
      throw error;
    }
  },

  // Get all events (simple query without ordering)
  getAll: async (limitCount = 20, lastDoc = null) => {
    try {
      let q = query(
        collection(db, COLLECTIONS.EVENTS),
        where('isActive', '==', true),
        limit(limitCount)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const querySnapshot = await getDocs(q);
      const events = [];
      
      querySnapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() });
      });

      return {
        events,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1]
      };
    } catch (error) {
      console.error('Error getting events:', error);
      throw error;
    }
  },

  // Get events by category
  getByCategory: async (category, limitCount = 20) => {
    try {
      const q = query(
        collection(db, COLLECTIONS.EVENTS),
        where('category', '==', category),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const events = [];
      
      querySnapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() });
      });

      return events;
    } catch (error) {
      console.error('Error getting events by category:', error);
      throw error;
    }
  },

  // Search events
  search: async (searchTerm) => {
    try {
      // Query only active events
      const q = query(
        collection(db, COLLECTIONS.EVENTS),
        where('isActive', '==', true)
      );

      const querySnapshot = await getDocs(q);
      const events = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const searchableText = `${data.name} ${data.description} ${data.location} ${data.category}`.toLowerCase();
        
        if (searchableText.includes(searchTerm.toLowerCase())) {
          events.push({ id: doc.id, ...data });
        }
      });

      return events;
    } catch (error) {
      console.error('Error searching events:', error);
      throw error;
    }
  },

  // Get events by organizer
  getByOrganizer: async (organizerId) => {
    try {
      const q = query(
        collection(db, COLLECTIONS.EVENTS),
        where('organizerId', '==', organizerId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const events = [];
      
      querySnapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() });
      });

      return events;
    } catch (error) {
      console.error('Error getting organizer events:', error);
      throw error;
    }
  },

  // Update event
  update: async (eventId, updates) => {
    try {
      const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
      await updateDoc(eventRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  // Delete event (soft delete)
  delete: async (eventId) => {
    try {
      const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
      await updateDoc(eventRef, {
        isActive: false,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },

  // Permanently delete event (hard delete)
  deletePermanently: async (eventId) => {
    try {
      const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
      await deleteDoc(eventRef);
    } catch (error) {
      console.error('Error permanently deleting event:', error);
      throw error;
    }
  },

  // Listen to real-time updates for an event
  subscribe: (eventId, callback) => {
    const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
    return onSnapshot(eventRef, callback);
  }
};

// Booking service with specific functions
export const bookingService = {
  create: async (bookingData) => {
    try {
      const bookingsRef = collection(db, COLLECTIONS.BOOKINGS);
      const docRef = await addDoc(bookingsRef, {
        ...bookingData,
        status: 'confirmed',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        bookingReference: `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      });

      // Update event ticket count
      if (bookingData.eventId) {
        const eventRef = doc(db, COLLECTIONS.EVENTS, bookingData.eventId);
        await updateDoc(eventRef, {
          soldTickets: increment(bookingData.quantity),
          availableTickets: increment(-bookingData.quantity),
        });
      }

      // Send email confirmation
      try {
        const bookingWithId = {
          ...bookingData,
          id: docRef.id,
          bookingReference: `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        };
        
        console.log('📧 Sending email confirmation for booking:', bookingWithId.id);
        const emailResult = await emailService.sendTicketConfirmation(bookingWithId);
        
        if (emailResult.success) {
          console.log('✅ Email confirmation sent successfully');
        } else {
          console.warn('⚠️ Email confirmation failed:', emailResult.message);
        }
      } catch (emailError) {
        console.error('❌ Email service error (booking still created):', emailError);
        // Don't throw here - booking was successful, email is secondary
      }

      return docRef;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  getUserBookings: async (userId) => {
    try {
      const bookingsRef = collection(db, COLLECTIONS.BOOKINGS);
      const q = query(bookingsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const bookings = [];
      querySnapshot.forEach((doc) => {
        bookings.push({ id: doc.id, ...doc.data() });
      });
      
      return bookings;
    } catch (error) {
      console.error('Error getting user bookings:', error);
      throw error;
    }
  },

  // Get all attendees/bookings for an event (for organizers)
  getEventAttendees: async (eventId) => {
    try {
      const bookingsRef = collection(db, COLLECTIONS.BOOKINGS);
      const q = query(bookingsRef, where('eventId', '==', eventId));
      const querySnapshot = await getDocs(q);
      
      const attendees = [];
      querySnapshot.forEach((doc) => {
        attendees.push({ id: doc.id, ...doc.data() });
      });
      
      return attendees;
    } catch (error) {
      console.error('Error getting event attendees:', error);
      throw error;
    }
  },

  // Check if user has already booked/RSVP'd for an event
  getUserBookingForEvent: async (userId, eventId) => {
    try {
      const bookingsRef = collection(db, COLLECTIONS.BOOKINGS);
      const q = query(
        bookingsRef, 
        where('userId', '==', userId),
        where('eventId', '==', eventId),
        where('status', '==', 'confirmed')
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
      
      return null;
    } catch (error) {
      console.error('Error checking user booking:', error);
      throw error;
    }
  },

  // Cancel/withdraw booking or RSVP
  cancelBooking: async (bookingId, eventId, quantity) => {
    try {
      // Update booking status to cancelled
      const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
      await updateDoc(bookingRef, {
        status: 'cancelled',
        updatedAt: serverTimestamp(),
      });

      // Update event ticket count
      if (eventId && quantity) {
        const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
        await updateDoc(eventRef, {
          soldTickets: increment(-quantity),
          availableTickets: increment(quantity),
        });
      }

      return true;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  },

  // Get a specific booking by ID
  getById: async (bookingId) => {
    try {
      console.log('🔍 Getting booking by ID:', bookingId);
      
      if (!bookingId || typeof bookingId !== 'string') {
        console.log('❌ Invalid booking ID:', bookingId);
        return null;
      }
      
      const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
      const bookingSnap = await getDoc(bookingRef);
      
      if (bookingSnap.exists()) {
        const booking = { id: bookingSnap.id, ...bookingSnap.data() };
        console.log('✅ Booking found:', booking);
        return booking;
      }
      
      console.log('❌ Booking not found for ID:', bookingId);
      return null;
    } catch (error) {
      console.error('❌ Error getting booking by ID:', error);
      console.error('❌ Booking ID was:', bookingId);
      console.error('❌ Error details:', error.message);
      throw error;
    }
  },

  // Update a booking
  update: async (bookingId, updates) => {
    try {
      console.log('🔄 Updating booking:', bookingId, 'with:', updates);
      
      if (!bookingId || typeof bookingId !== 'string') {
        console.log('❌ Invalid booking ID for update:', bookingId);
        throw new Error('Invalid booking ID provided');
      }
      
      const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
      await updateDoc(bookingRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Booking updated successfully');
    } catch (error) {
      console.error('❌ Error updating booking:', error);
      console.error('❌ Booking ID was:', bookingId);
      console.error('❌ Updates were:', updates);
      console.error('❌ Error details:', error.message);
      throw error;
    }
  },
};

// Categories Management
export const categoryService = {
  // Get all categories
  getAll: async () => {
    try {
      const querySnapshot = await getDocs(collection(db, COLLECTIONS.CATEGORIES));
      const categories = [];
      
      querySnapshot.forEach((doc) => {
        categories.push({ id: doc.id, ...doc.data() });
      });

      return categories;
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  },

  // Initialize default categories
  initializeDefaults: async () => {
    try {
      const defaultCategories = [
        { name: 'Music', icon: 'music', color: '#8B5CF6' },
        { name: 'Technology', icon: 'cpu', color: '#06B6D4' },
        { name: 'Business', icon: 'briefcase', color: '#10B981' },
        { name: 'Sports', icon: 'activity', color: '#F59E0B' },
        { name: 'Food & Drink', icon: 'coffee', color: '#EF4444' },
        { name: 'Arts & Culture', icon: 'image', color: '#EC4899' },
        { name: 'Health & Wellness', icon: 'heart', color: '#84CC16' },
        { name: 'Education', icon: 'book', color: '#6366F1' },
      ];

      const categoriesRef = collection(db, COLLECTIONS.CATEGORIES);
      
      for (const category of defaultCategories) {
        await addDoc(categoriesRef, {
          ...category,
          createdAt: serverTimestamp(),
        });
      }

      return defaultCategories;
    } catch (error) {
      console.error('Error initializing categories:', error);
      throw error;
    }
  }
};