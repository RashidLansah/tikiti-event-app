// Event Update/Announcement Service
import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

export interface EventUpdate {
  id?: string;
  eventId: string;
  type: 'cancelled' | 'postponed' | 'date_changed' | 'location_changed' | 'general';
  title: string;
  message: string;
  oldValue?: string; // For changes (old date, old location, etc.)
  newValue?: string; // For changes (new date, new location, etc.)
  createdAt: any;
  createdBy?: string;
}

const COLLECTIONS = {
  EVENTS: 'events',
  UPDATES: 'updates',
};

// Helper function to format date for display
const formatDateForDisplay = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString; // Return as-is if parsing fails
  }
};

// Helper function to extract location string
const extractLocationString = (location: any): string => {
  if (!location) return 'Location TBA';
  if (typeof location === 'string') return location;
  if (typeof location === 'object') {
    return location.name || location.address || location.toString() || 'Location TBA';
  }
  return String(location);
};

// Helper function to remove undefined values from an object (Firebase doesn't accept undefined)
const cleanUndefinedValues = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const cleaned: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
};

export const eventUpdateService = {
  // Create an event update/announcement
  createUpdate: async (
    eventId: string,
    updateData: Omit<EventUpdate, 'id' | 'createdAt'>
  ): Promise<EventUpdate> => {
    try {
      const updatesRef = collection(db, COLLECTIONS.EVENTS, eventId, COLLECTIONS.UPDATES);
      // Clean undefined values before saving to Firebase
      const cleanedData = cleanUndefinedValues(updateData);
      const updateRef = await addDoc(updatesRef, {
        ...cleanedData,
        createdAt: serverTimestamp(),
      });
      return { id: updateRef.id, ...cleanedData, createdAt: serverTimestamp() } as EventUpdate;
    } catch (error) {
      console.error('Error creating event update:', error);
      throw error;
    }
  },

  // Get all updates for an event
  getUpdatesByEvent: async (eventId: string): Promise<EventUpdate[]> => {
    try {
      const updatesRef = collection(db, COLLECTIONS.EVENTS, eventId, COLLECTIONS.UPDATES);
      const q = query(updatesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const updates: EventUpdate[] = [];
      snapshot.forEach((doc) => {
        updates.push({ id: doc.id, ...doc.data() } as EventUpdate);
      });
      
      return updates;
    } catch (error) {
      console.error('Error getting event updates:', error);
      throw error;
    }
  },

  // Create update for cancelled event
  createCancellationUpdate: async (
    eventId: string,
    eventName: string,
    reason?: string,
    createdBy?: string
  ): Promise<EventUpdate> => {
    return eventUpdateService.createUpdate(eventId, {
      eventId,
      type: 'cancelled',
      title: 'Event Cancelled',
      message: reason 
        ? `We regret to inform you that "${eventName}" has been cancelled. Reason: ${reason}`
        : `We regret to inform you that "${eventName}" has been cancelled.`,
      createdBy,
    });
  },

  // Create update for postponed event
  createPostponementUpdate: async (
    eventId: string,
    eventName: string,
    newDate: string,
    reason?: string,
    createdBy?: string
  ): Promise<EventUpdate> => {
    const formattedDate = formatDateForDisplay(newDate);
    return eventUpdateService.createUpdate(eventId, {
      eventId,
      type: 'postponed',
      title: 'Event Postponed',
      message: reason
        ? `"${eventName}" has been postponed to ${formattedDate}. Reason: ${reason}`
        : `"${eventName}" has been postponed to ${formattedDate}.`,
      oldValue: undefined, // Could store old date if available
      newValue: formattedDate,
      createdBy,
    });
  },

  // Create update for date change
  createDateChangeUpdate: async (
    eventId: string,
    eventName: string,
    oldDate: string,
    newDate: string,
    createdBy?: string
  ): Promise<EventUpdate> => {
    const formattedOldDate = formatDateForDisplay(oldDate);
    const formattedNewDate = formatDateForDisplay(newDate);
    return eventUpdateService.createUpdate(eventId, {
      eventId,
      type: 'date_changed',
      title: 'Event Date Changed',
      message: `The date for "${eventName}" has been changed from ${formattedOldDate} to ${formattedNewDate}.`,
      oldValue: formattedOldDate,
      newValue: formattedNewDate,
      createdBy,
    });
  },

  // Create update for location change
  createLocationChangeUpdate: async (
    eventId: string,
    eventName: string,
    oldLocation: any,
    newLocation: any,
    createdBy?: string
  ): Promise<EventUpdate> => {
    const formattedOldLocation = extractLocationString(oldLocation);
    const formattedNewLocation = extractLocationString(newLocation);
    return eventUpdateService.createUpdate(eventId, {
      eventId,
      type: 'location_changed',
      title: 'Event Location Changed',
      message: `The location for "${eventName}" has been changed from ${formattedOldLocation} to ${formattedNewLocation}.`,
      oldValue: formattedOldLocation,
      newValue: formattedNewLocation,
      createdBy,
    });
  },
};
