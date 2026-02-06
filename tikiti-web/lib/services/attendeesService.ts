// Attendees service for managing event attendees/bookings
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { eventService } from './eventService';

const COLLECTIONS = {
  BOOKINGS: 'bookings',
  RSVPS: 'rsvps',
  EVENTS: 'events',
};

export interface Attendee {
  id: string;
  odh?: string;
  userName?: string;
  userEmail: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  gender?: string;
  eventId: string;
  eventName?: string;
  registrationType: 'rsvp' | 'paid';
  quantity: number;
  totalPrice?: number;
  status: 'confirmed' | 'cancelled' | 'waitlisted';
  createdAt?: any;
  updatedAt?: any;
  // Custom form data
  customData?: Record<string, any>;
  // Check-in fields
  checkedIn?: boolean;
  checkedInAt?: any;
  checkedInBy?: string; // 'self' for app check-in, or organizer user id
  checkInMethod?: 'app' | 'manual' | 'qr';
}

interface AttendeeFilters {
  eventId?: string;
  status?: string;
  search?: string;
  startAfter?: QueryDocumentSnapshot;
  limitCount?: number;
}

export const attendeesService = {
  // Get attendees for an organization (across all events)
  getByOrganization: async (
    organizationId: string,
    filters: AttendeeFilters = {}
  ): Promise<Attendee[]> => {
    try {
      // First, get all events for this organization
      const orgEvents = await eventService.getByOrganization(organizationId);
      const eventIds = orgEvents.map((e) => e.id!);

      if (eventIds.length === 0) {
        return [];
      }

      // Get bookings from all organization events
      const bookingsRef = collection(db, COLLECTIONS.BOOKINGS);
      
      // If specific event filter is applied, use it directly
      if (filters.eventId) {
        let bookingsQuery = query(
          bookingsRef,
          where('eventId', '==', filters.eventId),
          orderBy('createdAt', 'desc')
        );

        if (filters.status && filters.status !== 'all') {
          bookingsQuery = query(bookingsQuery, where('status', '==', filters.status));
        }

        if (filters.limitCount) {
          bookingsQuery = query(bookingsQuery, limit(filters.limitCount));
        }

        if (filters.startAfter) {
          bookingsQuery = query(bookingsQuery, startAfter(filters.startAfter));
        }

        const bookingsSnapshot = await getDocs(bookingsQuery);
        const attendees: Attendee[] = [];
        const eventNameMap = new Map(orgEvents.map((e) => [e.id, e.name]));

        bookingsSnapshot.forEach((doc) => {
          const data = doc.data();
          const attendee: Attendee = {
            id: doc.id,
            userId: data.userId,
            userName: data.userName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Unknown',
            userEmail: data.userEmail,
            firstName: data.firstName,
            lastName: data.lastName,
            phoneNumber: data.phoneNumber,
            gender: data.gender,
            eventId: data.eventId,
            eventName: eventNameMap.get(data.eventId) || 'Unknown Event',
            registrationType: data.registrationType || 'rsvp',
            quantity: data.quantity || 1,
            totalPrice: data.totalPrice,
            status: data.status || 'confirmed',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            customData: data.customData,
          };

          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const matchesSearch =
              attendee.userName?.toLowerCase().includes(searchLower) ||
              attendee.userEmail?.toLowerCase().includes(searchLower) ||
              attendee.phoneNumber?.toLowerCase().includes(searchLower) ||
              attendee.firstName?.toLowerCase().includes(searchLower) ||
              attendee.lastName?.toLowerCase().includes(searchLower);

            if (!matchesSearch) {
              return;
            }
          }

          attendees.push(attendee);
        });

        attendees.sort((a, b) => {
          const aDate = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
          const bDate = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
          return bDate.getTime() - aDate.getTime();
        });

        return attendees;
      }

      // Handle multiple events - Firestore 'in' query limit is 10
      const eventBatches: string[][] = [];
      for (let i = 0; i < eventIds.length; i += 10) {
        eventBatches.push(eventIds.slice(i, i + 10));
      }

      const attendees: Attendee[] = [];

      // Create event name map for quick lookup
      const eventNameMap = new Map(orgEvents.map((e) => [e.id, e.name]));

      // Query each batch of events
      for (const batch of eventBatches) {
        const bookingsRef = collection(db, COLLECTIONS.BOOKINGS);
        let bookingsQuery = query(
          bookingsRef,
          where('eventId', 'in', batch),
          orderBy('createdAt', 'desc')
        );

        if (filters.status && filters.status !== 'all') {
          bookingsQuery = query(
            bookingsRef,
            where('eventId', 'in', batch),
            where('status', '==', filters.status),
            orderBy('createdAt', 'desc')
          );
        }

        const bookingsSnapshot = await getDocs(bookingsQuery);

        bookingsSnapshot.forEach((doc) => {
          const data = doc.data();
          const attendee: Attendee = {
            id: doc.id,
            userId: data.userId,
            userName: data.userName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Unknown',
            userEmail: data.userEmail,
            firstName: data.firstName,
            lastName: data.lastName,
            phoneNumber: data.phoneNumber,
            gender: data.gender,
            eventId: data.eventId,
            eventName: eventNameMap.get(data.eventId) || 'Unknown Event',
            registrationType: data.registrationType || 'rsvp',
            quantity: data.quantity || 1,
            totalPrice: data.totalPrice,
            status: data.status || 'confirmed',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            customData: data.customData,
          };

          // Apply search filter
          if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            const matchesSearch =
              attendee.userName?.toLowerCase().includes(searchLower) ||
              attendee.userEmail?.toLowerCase().includes(searchLower) ||
              attendee.phoneNumber?.toLowerCase().includes(searchLower) ||
              attendee.firstName?.toLowerCase().includes(searchLower) ||
              attendee.lastName?.toLowerCase().includes(searchLower);

            if (!matchesSearch) {
              return; // Skip this attendee
            }
          }

          attendees.push(attendee);
        });
      }

      // Sort by creation date (newest first)
      attendees.sort((a, b) => {
        const aDate = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
        const bDate = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
        return bDate.getTime() - aDate.getTime();
      });

      return attendees;
    } catch (error) {
      console.error('Error getting attendees by organization:', error);
      throw error;
    }
  },

  // Get attendees for a specific event
  getByEvent: async (eventId: string): Promise<Attendee[]> => {
    try {
      const bookingsRef = collection(db, COLLECTIONS.BOOKINGS);
      const q = query(
        bookingsRef,
        where('eventId', '==', eventId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);

      const attendees: Attendee[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        attendees.push({
          id: doc.id,
          userId: data.userId,
          userName: data.userName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Unknown',
          userEmail: data.userEmail,
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber,
          gender: data.gender,
          eventId: data.eventId,
          registrationType: data.registrationType || 'rsvp',
          quantity: data.quantity || 1,
          totalPrice: data.totalPrice,
          status: data.status || 'confirmed',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          customData: data.customData,
          checkedIn: data.checkedIn || false,
          checkedInAt: data.checkedInAt,
          checkedInBy: data.checkedInBy,
          checkInMethod: data.checkInMethod,
        });
      });

      return attendees;
    } catch (error) {
      console.error('Error getting attendees by event:', error);
      throw error;
    }
  },

  // Get attendee statistics for an organization
  getStats: async (organizationId: string): Promise<{
    total: number;
    confirmed: number;
    cancelled: number;
    thisMonth: number;
  }> => {
    try {
      const attendees = await attendeesService.getByOrganization(organizationId);
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      return {
        total: attendees.length,
        confirmed: attendees.filter((a) => a.status === 'confirmed').length,
        cancelled: attendees.filter((a) => a.status === 'cancelled').length,
        thisMonth: attendees.filter((a) => {
          const createdAt = a.createdAt?.toDate?.() || a.createdAt;
          return createdAt && new Date(createdAt) >= firstDayOfMonth;
        }).length,
      };
    } catch (error) {
      console.error('Error getting attendee stats:', error);
      throw error;
    }
  },

  // Check-in an attendee
  checkIn: async (
    bookingId: string,
    checkedInBy: string,
    checkInMethod: 'app' | 'manual' | 'qr' = 'manual'
  ): Promise<void> => {
    try {
      const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
      await updateDoc(bookingRef, {
        checkedIn: true,
        checkedInAt: Timestamp.now(),
        checkedInBy,
        checkInMethod,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error checking in attendee:', error);
      throw error;
    }
  },

  // Undo check-in
  undoCheckIn: async (bookingId: string): Promise<void> => {
    try {
      const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
      await updateDoc(bookingRef, {
        checkedIn: false,
        checkedInAt: null,
        checkedInBy: null,
        checkInMethod: null,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error undoing check-in:', error);
      throw error;
    }
  },

  // Get check-in stats for an event
  getCheckInStats: async (eventId: string): Promise<{
    total: number;
    checkedIn: number;
    notCheckedIn: number;
    checkInRate: number;
  }> => {
    try {
      const attendees = await attendeesService.getByEvent(eventId);
      const confirmedAttendees = attendees.filter((a) => a.status === 'confirmed');
      const checkedIn = confirmedAttendees.filter((a) => a.checkedIn).length;
      const total = confirmedAttendees.length;

      return {
        total,
        checkedIn,
        notCheckedIn: total - checkedIn,
        checkInRate: total > 0 ? Math.round((checkedIn / total) * 100) : 0,
      };
    } catch (error) {
      console.error('Error getting check-in stats:', error);
      throw error;
    }
  },

  // Get attendee by ID
  getById: async (bookingId: string): Promise<Attendee | null> => {
    try {
      const bookingRef = doc(db, COLLECTIONS.BOOKINGS, bookingId);
      const bookingSnap = await getDoc(bookingRef);

      if (!bookingSnap.exists()) {
        return null;
      }

      const data = bookingSnap.data();
      return {
        id: bookingSnap.id,
        userId: data.userId,
        userName: data.userName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Unknown',
        userEmail: data.userEmail,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        gender: data.gender,
        eventId: data.eventId,
        registrationType: data.registrationType || 'rsvp',
        quantity: data.quantity || 1,
        totalPrice: data.totalPrice,
        status: data.status || 'confirmed',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        customData: data.customData,
        checkedIn: data.checkedIn || false,
        checkedInAt: data.checkedInAt,
        checkedInBy: data.checkedInBy,
        checkInMethod: data.checkInMethod,
      };
    } catch (error) {
      console.error('Error getting attendee by ID:', error);
      throw error;
    }
  },

  // Search attendees by email or name for check-in
  searchForCheckIn: async (
    eventId: string,
    searchTerm: string
  ): Promise<Attendee[]> => {
    try {
      const attendees = await attendeesService.getByEvent(eventId);
      const searchLower = searchTerm.toLowerCase().trim();

      return attendees.filter((a) => {
        if (a.status !== 'confirmed') return false;

        return (
          a.userEmail?.toLowerCase().includes(searchLower) ||
          a.userName?.toLowerCase().includes(searchLower) ||
          a.firstName?.toLowerCase().includes(searchLower) ||
          a.lastName?.toLowerCase().includes(searchLower) ||
          a.phoneNumber?.includes(searchTerm)
        );
      });
    } catch (error) {
      console.error('Error searching attendees:', error);
      throw error;
    }
  },
};
