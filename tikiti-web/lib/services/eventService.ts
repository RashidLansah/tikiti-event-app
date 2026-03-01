// Event service for web dashboard
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
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { RegistrationForm, FormField } from '@/types/form';
import { Program } from '@/types/program';
import { Cohort } from '@/types/cohort';
import { eventUpdateService } from './eventUpdateService';

const COLLECTIONS = {
  EVENTS: 'events'
};

export interface Event {
  id?: string;
  name: string;
  description: string;
  venueType?: 'in_person' | 'virtual' | 'hybrid'; // New field for event venue type
  location: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  meetingLink?: string; // For virtual/hybrid events
  meetingPlatform?: string; // e.g., 'zoom', 'google_meet', 'teams', 'other'
  date: string; // YYYY-MM-DD (also serves as start date for multi-day events)
  time: string; // HH:mm
  startTime?: string;
  startDate?: string; // YYYY-MM-DD (for multi-day events)
  endDate?: string; // YYYY-MM-DD (for multi-day events)
  category: string;
  type: 'free' | 'paid';
  price?: number;
  totalTickets: number;
  availableTickets: number;
  soldTickets: number;
  organizerId: string;
  organizationId?: string;
  organizerName?: string;
  organizerEmail?: string;
  organizerPhone?: string;
  imageUrl?: string;
  imageBase64?: string;
  status: 'draft' | 'published' | 'archived' | 'cancelled';
  isActive: boolean;
  registrationForm?: RegistrationForm;
  program?: Program;
  cohorts?: Record<string, Cohort>; // Map keyed by cohort ID for atomic Firestore updates
  hasCohorts?: boolean;
  createdAt?: any;
  updatedAt?: any;
  publishedAt?: any;
}

// Helper function to recursively remove undefined values from objects (Firestore doesn't accept undefined)
const deepCleanUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return undefined;
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    const cleaned = obj.map(deepCleanUndefined).filter(item => item !== undefined);
    return cleaned.length > 0 ? cleaned : undefined;
  }
  
  // Handle objects
  if (typeof obj === 'object' && obj.constructor === Object) {
    const cleaned: any = {};
    let hasValues = false;
    
    for (const [key, value] of Object.entries(obj)) {
      const cleanedValue = deepCleanUndefined(value);
      if (cleanedValue !== undefined) {
        cleaned[key] = cleanedValue;
        hasValues = true;
      }
    }
    
    return hasValues ? cleaned : undefined;
  }
  
  // Primitive values
  return obj;
};

export const eventService = {
  // Create event
  create: async (eventData: Partial<Event>, organizerId: string, organizationId?: string): Promise<Event> => {
    try {
      // Check if image is too large before creating
      if (eventData.imageBase64) {
        const sizeInBytes = Math.ceil((eventData.imageBase64.length * 3) / 4);
        const sizeInMB = sizeInBytes / (1024 * 1024);
        
        if (sizeInMB > 1) {
          throw new Error(`Image is too large (${sizeInMB.toFixed(2)} MB). Please choose a smaller image under 1MB.`);
        }
      }
      
      const eventsRef = collection(db, COLLECTIONS.EVENTS);
      const eventWithDefaults: any = {
        name: eventData.name || '',
        description: eventData.description || '',
        venueType: eventData.venueType || 'in_person',
        location: eventData.location || '',
        date: eventData.date || '',
        time: eventData.time || '',
        startTime: eventData.startTime || eventData.time || '',
        category: eventData.category || '',
        type: eventData.type || 'free',
        price: eventData.price || 0,
        totalTickets: eventData.totalTickets || 100,
        availableTickets: eventData.totalTickets || 100,
        soldTickets: 0,
        organizerId,
        status: eventData.status || 'draft',
        isActive: eventData.isActive ?? true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Only include optional fields if they have values (avoid undefined)
      if (eventData.address) {
        eventWithDefaults.address = eventData.address;
      }
      if (eventData.coordinates) {
        eventWithDefaults.coordinates = eventData.coordinates;
      }
      if (eventData.meetingLink) {
        eventWithDefaults.meetingLink = eventData.meetingLink;
      }
      if (eventData.meetingPlatform) {
        eventWithDefaults.meetingPlatform = eventData.meetingPlatform;
      }
      if (organizationId || eventData.organizationId) {
        eventWithDefaults.organizationId = organizationId || eventData.organizationId;
      }
      if (eventData.organizerName) {
        eventWithDefaults.organizerName = eventData.organizerName;
      }
      if (eventData.organizerEmail) {
        eventWithDefaults.organizerEmail = eventData.organizerEmail;
      }
      if (eventData.organizerPhone) {
        eventWithDefaults.organizerPhone = eventData.organizerPhone;
      }
      if (eventData.imageUrl) {
        eventWithDefaults.imageUrl = eventData.imageUrl;
      }
      if (eventData.imageBase64) {
        eventWithDefaults.imageBase64 = eventData.imageBase64;
      }
      if (eventData.startDate) {
        eventWithDefaults.startDate = eventData.startDate;
      }
      if (eventData.endDate) {
        eventWithDefaults.endDate = eventData.endDate;
      }
      if (eventData.registrationForm) {
        eventWithDefaults.registrationForm = eventData.registrationForm;
      } else {
        // Add default registration form fields (matching mobile app defaults)
        eventWithDefaults.registrationForm = {
          fields: [
            {
              id: 'firstName',
              type: 'text' as const,
              label: 'First Name',
              placeholder: 'Enter your first name',
              required: true,
            },
            {
              id: 'lastName',
              type: 'text' as const,
              label: 'Last Name',
              placeholder: 'Enter your last name',
              required: true,
            },
            {
              id: 'email',
              type: 'email' as const,
              label: 'Email Address',
              placeholder: 'Enter your email address',
              required: true,
            },
            {
              id: 'phone',
              type: 'phone' as const,
              label: 'Phone Number',
              placeholder: 'Enter your phone number',
              required: true,
            },
            {
              id: 'gender',
              type: 'dropdown' as const,
              label: 'Gender',
              placeholder: 'Select gender',
              required: true,
              options: ['Male', 'Female', 'Other'],
            },
          ],
          consentRequired: false,
        };
      }
      if (eventData.program) {
        eventWithDefaults.program = eventData.program;
      }

      // Filter out undefined values before saving to Firestore
      const filteredEvent: any = {};
      Object.keys(eventWithDefaults).forEach((key) => {
        if (eventWithDefaults[key] !== undefined) {
          filteredEvent[key] = eventWithDefaults[key];
        }
      });

      const docRef = await addDoc(eventsRef, filteredEvent);
      const createdEvent = { id: docRef.id, ...filteredEvent };
      console.log('Event created successfully:', createdEvent.id, 'Status:', createdEvent.status);
      return createdEvent;
    } catch (error: any) {
      console.error('Error creating event:', error);
      // Provide more specific error messages
      if (error.code === 'permission-denied') {
        throw new Error('Permission denied. Please check your organization permissions.');
      } else if (error.message?.includes('Missing or insufficient permissions')) {
        throw new Error('Permission denied. Please check your organization permissions.');
      }
      throw error;
    }
  },

  // Get event by ID
  getById: async (eventId: string): Promise<Event | null> => {
    try {
      const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
      const eventSnap = await getDoc(eventRef);
      
      if (eventSnap.exists()) {
        return { id: eventSnap.id, ...eventSnap.data() } as Event;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting event:', error);
      throw error;
    }
  },

  // Get events by organization
  getByOrganization: async (organizationId: string, filters?: {
    status?: Event['status'];
    category?: string;
    search?: string;
  }): Promise<Event[]> => {
    try {
      const eventsRef = collection(db, COLLECTIONS.EVENTS);
      let q = query(eventsRef, where('organizationId', '==', organizationId));

      // Apply filters
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status));
      }

      if (filters?.category) {
        q = query(q, where('category', '==', filters.category));
      }

      q = query(q, orderBy('createdAt', 'desc'));

      const eventsSnapshot = await getDocs(q);
      const events: Event[] = [];

      eventsSnapshot.forEach((doc) => {
        const data = doc.data();
        events.push({ id: doc.id, ...data } as Event);
      });

      // Apply search filter (client-side for now)
      let filteredEvents = events;
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredEvents = events.filter(event =>
          event.name.toLowerCase().includes(searchLower) ||
          event.description.toLowerCase().includes(searchLower) ||
          event.location.toLowerCase().includes(searchLower)
        );
      }

      return filteredEvents;
    } catch (error) {
      console.error('Error getting events by organization:', error);
      throw error;
    }
  },

  // Get events by organizer
  getByOrganizer: async (organizerId: string): Promise<Event[]> => {
    try {
      const eventsRef = collection(db, COLLECTIONS.EVENTS);
      const q = query(
        eventsRef, 
        where('organizerId', '==', organizerId),
        orderBy('createdAt', 'desc')
      );

      const eventsSnapshot = await getDocs(q);
      const events: Event[] = [];

      eventsSnapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() } as Event);
      });

      return events;
    } catch (error) {
      console.error('Error getting events by organizer:', error);
      throw error;
    }
  },

  // Update event
  update: async (eventId: string, updates: Partial<Event>): Promise<void> => {
    try {
      // Get current event to detect changes
      const currentEvent = await eventService.getById(eventId);
      
      // Check if image is too large
      if (updates.imageBase64) {
        const sizeInBytes = Math.ceil((updates.imageBase64.length * 3) / 4);
        const sizeInMB = sizeInBytes / (1024 * 1024);
        
        if (sizeInMB > 1) {
          throw new Error(`Image is too large (${sizeInMB.toFixed(2)} MB). Please choose a smaller image under 1MB.`);
        }
      }

      // Filter out undefined values (Firestore doesn't accept undefined)
      const cleanUpdates: any = {
        updatedAt: serverTimestamp(),
      };

      // Only include fields that are not undefined, and deep clean nested objects
      Object.keys(updates).forEach((key) => {
        const value = (updates as any)[key];
        if (value !== undefined) {
          const cleanedValue = deepCleanUndefined(value);
          if (cleanedValue !== undefined) {
            cleanUpdates[key] = cleanedValue;
          }
        }
      });

      // If status changes to published, set publishedAt
      if (updates.status === 'published') {
        cleanUpdates.publishedAt = serverTimestamp();
      }

      const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
      await updateDoc(eventRef, cleanUpdates);

      // Detect status changes and create announcements
      if (currentEvent && updates.status && updates.status !== currentEvent.status) {
        const eventName = updates.name || currentEvent.name;

        // Handle cancellation
        if (updates.status === 'cancelled') {
          await eventUpdateService.createCancellationUpdate(
            eventId,
            eventName,
            (updates as any).cancellationReason,
            (updates as any).updatedBy
          );

          // Trigger notification sending (non-blocking)
          fetch('/api/notify-event-change', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventId,
              changeType: 'cancelled',
              eventName,
              reason: (updates as any).cancellationReason,
            }),
          }).catch(err => console.error('Error sending notifications:', err));
        }
      }

      // Detect date changes
      if (currentEvent && updates.date && updates.date !== currentEvent.date) {
        await eventUpdateService.createDateChangeUpdate(
          eventId,
          updates.name || currentEvent.name,
          currentEvent.date,
          updates.date,
          (updates as any).updatedBy
        );
      }

      // Detect location changes
      if (currentEvent && updates.location) {
        // Handle both string and object locations
        const oldLocationStr = typeof currentEvent.location === 'object'
          ? (currentEvent.location as any)?.name || (currentEvent.location as any)?.address || String(currentEvent.location)
          : currentEvent.location || '';
        const newLocationStr = typeof updates.location === 'object'
          ? (updates.location as any)?.name || (updates.location as any)?.address || String(updates.location)
          : updates.location;

        if (oldLocationStr !== newLocationStr) {
          await eventUpdateService.createLocationChangeUpdate(
            eventId,
            updates.name || currentEvent.name,
            currentEvent.location,
            updates.location,
            (updates as any).updatedBy
          );
        }
      }
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  // Delete event (soft delete by setting status to archived)
  delete: async (eventId: string): Promise<void> => {
    try {
      const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
      await updateDoc(eventRef, {
        status: 'archived',
        isActive: false,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },

  // Publish event
  publish: async (eventId: string): Promise<void> => {
    try {
      const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
      await updateDoc(eventRef, {
        status: 'published',
        isActive: true,
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error publishing event:', error);
      throw error;
    }
  },

  // Duplicate event
  duplicate: async (eventId: string, organizerId: string, organizationId?: string): Promise<Event> => {
    try {
      const originalEvent = await eventService.getById(eventId);
      if (!originalEvent) {
        throw new Error('Event not found');
      }

      // Create new event with duplicated data, filtering out undefined values
      const duplicatedEvent: Partial<Event> = {
        name: `${originalEvent.name} (Copy)`,
        description: originalEvent.description || '',
        venueType: originalEvent.venueType || 'in_person',
        location: originalEvent.location || '',
        date: originalEvent.date || '',
        time: originalEvent.time || '',
        startTime: originalEvent.startTime || originalEvent.time || '',
        category: originalEvent.category || '',
        type: originalEvent.type || 'free',
        price: originalEvent.price || 0,
        totalTickets: originalEvent.totalTickets || 100,
        availableTickets: originalEvent.totalTickets || 100,
        soldTickets: 0,
        organizerId,
        status: 'draft',
        isActive: true,
      };

      // Only include optional fields if they have values
      if (originalEvent.address) {
        duplicatedEvent.address = originalEvent.address;
      }
      if (originalEvent.coordinates) {
        duplicatedEvent.coordinates = originalEvent.coordinates;
      }
      if (originalEvent.meetingLink) {
        duplicatedEvent.meetingLink = originalEvent.meetingLink;
      }
      if (originalEvent.meetingPlatform) {
        duplicatedEvent.meetingPlatform = originalEvent.meetingPlatform;
      }
      if (organizationId || originalEvent.organizationId) {
        duplicatedEvent.organizationId = organizationId || originalEvent.organizationId;
      }
      if (originalEvent.organizerName) {
        duplicatedEvent.organizerName = originalEvent.organizerName;
      }
      if (originalEvent.organizerEmail) {
        duplicatedEvent.organizerEmail = originalEvent.organizerEmail;
      }
      if (originalEvent.organizerPhone) {
        duplicatedEvent.organizerPhone = originalEvent.organizerPhone;
      }
      if (originalEvent.imageUrl) {
        duplicatedEvent.imageUrl = originalEvent.imageUrl;
      }
      // Don't duplicate image base64 for large images
      if (originalEvent.imageBase64 && originalEvent.imageBase64.length < 100000) {
        duplicatedEvent.imageBase64 = originalEvent.imageBase64;
      }
      if (originalEvent.registrationForm) {
        duplicatedEvent.registrationForm = originalEvent.registrationForm;
      }
      if (originalEvent.program) {
        duplicatedEvent.program = originalEvent.program;
      }
      if (originalEvent.startDate) {
        duplicatedEvent.startDate = originalEvent.startDate;
      }
      if (originalEvent.endDate) {
        duplicatedEvent.endDate = originalEvent.endDate;
      }

      return await eventService.create(duplicatedEvent, organizerId, organizationId);
    } catch (error) {
      console.error('Error duplicating event:', error);
      throw error;
    }
  },

  // Archive past events for an organization (runs once on dashboard load)
  archivePastEvents: async (organizationId: string, bufferHours: number = 24): Promise<{ archivedCount: number }> => {
    try {
      const eventsRef = collection(db, COLLECTIONS.EVENTS);
      const q = query(
        eventsRef,
        where('organizationId', '==', organizationId),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      const now = new Date();
      let archivedCount = 0;

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const eventEndDate = data.endDate || data.date;
        const eventEndTime = new Date(`${eventEndDate} ${data.endTime || '23:59'}`);
        const archiveTime = new Date(eventEndTime.getTime() + bufferHours * 60 * 60 * 1000);

        if (now >= archiveTime && data.status !== 'archived') {
          const eventRef = doc(db, COLLECTIONS.EVENTS, docSnap.id);
          await updateDoc(eventRef, {
            status: 'archived',
            isActive: false,
            updatedAt: serverTimestamp(),
          });
          archivedCount++;
        }
      }

      if (archivedCount > 0) {
        console.log(`Auto-archived ${archivedCount} past events for organization`);
      }

      return { archivedCount };
    } catch (error) {
      console.error('Error archiving past events:', error);
      return { archivedCount: 0 };
    }
  },

  // Get event statistics
  getStatistics: async (organizationId: string): Promise<{
    total: number;
    published: number;
    draft: number;
    archived: number;
    totalAttendees: number;
  }> => {
    try {
      const events = await eventService.getByOrganization(organizationId);
      
      return {
        total: events.length,
        published: events.filter(e => e.status === 'published').length,
        draft: events.filter(e => e.status === 'draft').length,
        archived: events.filter(e => e.status === 'archived').length,
        totalAttendees: events.reduce((sum, e) => sum + (e.soldTickets || 0), 0),
      };
    } catch (error) {
      console.error('Error getting event statistics:', error);
      throw error;
    }
  },
};

export default eventService;
