import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  query,
  orderBy,
  limit,
  getCountFromServer,
  Timestamp,
  where
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Types
export interface PlatformUser {
  id: string;
  email: string;
  displayName: string;
  accountType: 'user' | 'organiser';
  createdAt: Date | null;
  lastLoginAt: Date | null;
  organizationId?: string;
  photoURL?: string;
}

export interface PlatformEvent {
  id: string;
  title: string;
  organizationId: string;
  organizationName?: string;
  status: 'draft' | 'published' | 'archived' | 'cancelled';
  date: string;
  location: string;
  venueType: 'physical' | 'virtual' | 'hybrid';
  createdAt: Date | null;
  totalRegistrations: number;
  totalCheckedIn: number;
  imageBase64?: string;
}

export interface PlatformOrganization {
  id: string;
  name: string;
  ownerId: string;
  ownerEmail?: string;
  createdAt: Date | null;
  eventsCount: number;
  membersCount: number;
}

export interface PlatformStats {
  totalUsers: number;
  totalOrganizers: number;
  totalRegularUsers: number;
  totalEvents: number;
  publishedEvents: number;
  draftEvents: number;
  totalOrganizations: number;
  totalRegistrations: number;
  recentUsers: PlatformUser[];
  recentEvents: PlatformEvent[];
}

// Helper to convert Firestore timestamp
const toDate = (timestamp: unknown): Date | null => {
  if (!timestamp) return null;
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'string') return new Date(timestamp);
  return null;
};

// Admin Service
export const adminService = {
  // Get platform-wide statistics
  async getPlatformStats(): Promise<PlatformStats> {
    // Get user counts
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getCountFromServer(usersRef);
    const totalUsers = usersSnapshot.data().count;

    // Get organizers count
    const organizersQuery = query(usersRef, where('accountType', '==', 'organiser'));
    const organizersSnapshot = await getCountFromServer(organizersQuery);
    const totalOrganizers = organizersSnapshot.data().count;

    // Get events count
    const eventsRef = collection(db, 'events');
    const eventsSnapshot = await getCountFromServer(eventsRef);
    const totalEvents = eventsSnapshot.data().count;

    // Get published events count
    const publishedQuery = query(eventsRef, where('status', '==', 'published'));
    const publishedSnapshot = await getCountFromServer(publishedQuery);
    const publishedEvents = publishedSnapshot.data().count;

    // Get draft events count
    const draftQuery = query(eventsRef, where('status', '==', 'draft'));
    const draftSnapshot = await getCountFromServer(draftQuery);
    const draftEvents = draftSnapshot.data().count;

    // Get organizations count
    const orgsRef = collection(db, 'organizations');
    const orgsSnapshot = await getCountFromServer(orgsRef);
    const totalOrganizations = orgsSnapshot.data().count;

    // Get registrations count
    const bookingsRef = collection(db, 'bookings');
    const bookingsSnapshot = await getCountFromServer(bookingsRef);
    const totalRegistrations = bookingsSnapshot.data().count;

    // Get recent users (last 5)
    const recentUsersQuery = query(usersRef, orderBy('createdAt', 'desc'), limit(5));
    const recentUsersSnapshot = await getDocs(recentUsersQuery);
    const recentUsers: PlatformUser[] = recentUsersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email || '',
        displayName: data.displayName || data.email?.split('@')[0] || 'Unknown',
        accountType: data.accountType || 'user',
        createdAt: toDate(data.createdAt),
        lastLoginAt: toDate(data.lastLoginAt),
        organizationId: data.organizationId,
        photoURL: data.photoURL
      };
    });

    // Get recent events (last 5)
    const recentEventsQuery = query(eventsRef, orderBy('createdAt', 'desc'), limit(5));
    const recentEventsSnapshot = await getDocs(recentEventsQuery);
    const recentEvents: PlatformEvent[] = recentEventsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || 'Untitled Event',
        organizationId: data.organizationId || '',
        status: data.status || 'draft',
        date: data.date || '',
        location: data.location || '',
        venueType: data.venueType || 'physical',
        createdAt: toDate(data.createdAt),
        totalRegistrations: data.totalRegistrations || 0,
        totalCheckedIn: data.totalCheckedIn || 0,
        imageBase64: data.imageBase64
      };
    });

    return {
      totalUsers,
      totalOrganizers,
      totalRegularUsers: totalUsers - totalOrganizers,
      totalEvents,
      publishedEvents,
      draftEvents,
      totalOrganizations,
      totalRegistrations,
      recentUsers,
      recentEvents
    };
  },

  // Get all users with pagination
  async getAllUsers(limitCount: number = 50): Promise<PlatformUser[]> {
    const usersRef = collection(db, 'users');
    const usersQuery = query(usersRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(usersQuery);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email || '',
        displayName: data.displayName || data.email?.split('@')[0] || 'Unknown',
        accountType: data.accountType || 'user',
        createdAt: toDate(data.createdAt),
        lastLoginAt: toDate(data.lastLoginAt),
        organizationId: data.organizationId,
        photoURL: data.photoURL
      };
    });
  },

  // Get all events with pagination
  async getAllEvents(limitCount: number = 50): Promise<PlatformEvent[]> {
    const eventsRef = collection(db, 'events');
    const eventsQuery = query(eventsRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(eventsQuery);

    // Get organization names
    const orgIds = [...new Set(snapshot.docs.map(d => d.data().organizationId).filter(Boolean))];
    const orgNames: Record<string, string> = {};

    for (const orgId of orgIds) {
      try {
        const orgsRef = collection(db, 'organizations');
        const orgQuery = query(orgsRef, where('__name__', '==', orgId));
        const orgSnapshot = await getDocs(orgQuery);
        if (!orgSnapshot.empty) {
          orgNames[orgId] = orgSnapshot.docs[0].data().name || 'Unknown Organization';
        }
      } catch {
        // Ignore errors fetching org names
      }
    }

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || 'Untitled Event',
        organizationId: data.organizationId || '',
        organizationName: orgNames[data.organizationId] || 'Unknown',
        status: data.status || 'draft',
        date: data.date || '',
        location: data.location || '',
        venueType: data.venueType || 'physical',
        createdAt: toDate(data.createdAt),
        totalRegistrations: data.totalRegistrations || 0,
        totalCheckedIn: data.totalCheckedIn || 0,
        imageBase64: data.imageBase64
      };
    });
  },

  // Get all organizations
  async getAllOrganizations(limitCount: number = 50): Promise<PlatformOrganization[]> {
    const orgsRef = collection(db, 'organizations');
    const orgsQuery = query(orgsRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(orgsQuery);

    const orgs: PlatformOrganization[] = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();

      // Get events count for this org
      const eventsQuery = query(collection(db, 'events'), where('organizationId', '==', docSnap.id));
      const eventsSnapshot = await getCountFromServer(eventsQuery);

      // Get members count
      const membersRef = collection(db, 'organizations', docSnap.id, 'members');
      const membersSnapshot = await getCountFromServer(membersRef);

      orgs.push({
        id: docSnap.id,
        name: data.name || 'Unknown Organization',
        ownerId: data.ownerId || '',
        ownerEmail: data.ownerEmail,
        createdAt: toDate(data.createdAt),
        eventsCount: eventsSnapshot.data().count,
        membersCount: membersSnapshot.data().count
      });
    }

    return orgs;
  },

  // Delete a user
  async deleteUser(userId: string): Promise<void> {
    // Delete user document from Firestore
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);

    // Note: This doesn't delete the Firebase Auth user
    // That requires Firebase Admin SDK on the server
  },

  // Delete an event
  async deleteEvent(eventId: string): Promise<void> {
    const eventRef = doc(db, 'events', eventId);
    await deleteDoc(eventRef);
  },

  // Delete an organization
  async deleteOrganization(orgId: string): Promise<void> {
    const orgRef = doc(db, 'organizations', orgId);
    await deleteDoc(orgRef);
  }
};
