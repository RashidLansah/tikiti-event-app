// User Profile Service — audience intelligence data layer
// Silently tracks event attendance metadata per user to build rich profiles
// over time. This data powers future organizer audience targeting tools.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  increment,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../firebase/config';

// ─── Collections ────────────────────────────────────────────────────────────

const COLLECTIONS = {
  USERS: 'users',
  USER_EVENT_HISTORY: 'userEventHistory', // top-level: userEventHistory/{userId}/events/{eventId}
  BOOKINGS: 'bookings',
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EventHistoryEntry {
  eventId: string;
  eventName: string;
  category: string;
  venueType: 'in_person' | 'virtual' | 'hybrid' | string;
  eventType: 'free' | 'paid';
  date: string; // YYYY-MM-DD
  location?: string;
  organizationId?: string;
  bookingId: string;
  registeredAt: Timestamp;
  checkedIn: boolean;
  checkedInAt?: Timestamp;
  tags?: string[]; // derived from category
}

export interface UserEventStats {
  totalRegistered: number;
  totalAttended: number; // checked-in count
  categoriesAttended: Record<string, number>; // { "Tech": 3, "Business": 1 }
  formatBreakdown: {
    in_person: number;
    virtual: number;
    hybrid: number;
  };
  paidEventsCount: number;
  freeEventsCount: number;
  lastEventDate?: string;
  firstEventDate?: string;
}

export interface AudienceProfile {
  // Stored on the users/{uid} document
  interests?: string[]; // user-selected interest tags
  profession?: string;
  industry?: string;
  allowOrganizerContact: boolean; // consent to receive event invites
  eventStats?: UserEventStats;
  profileCompleteness?: number; // 0–100 score
  profileUpdatedAt?: Timestamp;
}

// Interest tag options shown to users
export const INTEREST_TAGS = [
  'Technology',
  'Business',
  'Arts & Culture',
  'Health & Wellness',
  'Education',
  'Finance',
  'Sports',
  'Music',
  'Networking',
  'Food & Drink',
  'Fashion',
  'Social Impact',
  'Startup',
  'Faith',
  'Entertainment',
  'Workshops',
];

export const INDUSTRY_OPTIONS = [
  'Technology',
  'Finance & Banking',
  'Healthcare',
  'Education',
  'Media & Entertainment',
  'Retail & E-commerce',
  'Non-profit',
  'Government',
  'Real Estate',
  'Manufacturing',
  'Consulting',
  'Other',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function deriveTagsFromCategory(category: string): string[] {
  const map: Record<string, string[]> = {
    Technology: ['tech', 'innovation'],
    Business: ['business', 'networking'],
    'Arts & Culture': ['arts', 'culture'],
    Music: ['music', 'entertainment'],
    Sports: ['sports', 'fitness'],
    Education: ['education', 'learning'],
    Finance: ['finance', 'investment'],
    Health: ['health', 'wellness'],
    Food: ['food', 'lifestyle'],
    Fashion: ['fashion', 'lifestyle'],
  };
  const key = Object.keys(map).find((k) =>
    category.toLowerCase().includes(k.toLowerCase())
  );
  return key ? map[key] : [category.toLowerCase()];
}

function calculateProfileCompleteness(profile: Partial<AudienceProfile>): number {
  let score = 0;
  if (profile.interests && profile.interests.length > 0) score += 30;
  if (profile.profession) score += 25;
  if (profile.industry) score += 25;
  if (profile.allowOrganizerContact !== undefined) score += 20;
  return score;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const userProfileService = {
  /**
   * Called silently every time a booking is confirmed.
   * Records the event in the user's history and updates their aggregate stats.
   * If the userId is a 'manual_*' guest entry, this is a no-op.
   */
  recordEventAttendance: async (
    userId: string,
    booking: {
      bookingId: string;
      eventId: string;
      eventName: string;
      category: string;
      venueType: string;
      eventType: 'free' | 'paid';
      date: string;
      location?: string;
      organizationId?: string;
    }
  ): Promise<void> => {
    // Skip guest/manual bookings — no persistent user profile to update
    if (!userId || userId.startsWith('manual_')) return;

    try {
      const entry: EventHistoryEntry = {
        eventId: booking.eventId,
        eventName: booking.eventName,
        category: booking.category || 'Other',
        venueType: booking.venueType || 'in_person',
        eventType: booking.eventType || 'free',
        date: booking.date,
        location: booking.location,
        organizationId: booking.organizationId,
        bookingId: booking.bookingId,
        registeredAt: Timestamp.now(),
        checkedIn: false,
        tags: deriveTagsFromCategory(booking.category || 'Other'),
      };

      // Write to userEventHistory/{userId}/events/{eventId}
      const historyRef = doc(
        db,
        `${COLLECTIONS.USER_EVENT_HISTORY}/${userId}/events`,
        booking.eventId
      );
      await setDoc(historyRef, entry, { merge: true });

      // Update aggregate stats on the users/{userId} doc
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      const statsUpdate: Record<string, any> = {
        [`eventStats.totalRegistered`]: increment(1),
        [`eventStats.categoriesAttended.${booking.category || 'Other'}`]: increment(1),
        [`eventStats.lastEventDate`]: booking.date,
        profileUpdatedAt: Timestamp.now(),
      };

      // Track format breakdown
      const fmt = booking.venueType || 'in_person';
      if (['in_person', 'virtual', 'hybrid'].includes(fmt)) {
        statsUpdate[`eventStats.formatBreakdown.${fmt}`] = increment(1);
      }

      // Track free vs paid
      if (booking.eventType === 'paid') {
        statsUpdate['eventStats.paidEventsCount'] = increment(1);
      } else {
        statsUpdate['eventStats.freeEventsCount'] = increment(1);
      }

      await updateDoc(userRef, statsUpdate).catch(async () => {
        // If user doc doesn't have eventStats yet, initialise it
        await setDoc(
          userRef,
          {
            eventStats: {
              totalRegistered: 1,
              totalAttended: 0,
              categoriesAttended: { [booking.category || 'Other']: 1 },
              formatBreakdown: {
                in_person: fmt === 'in_person' ? 1 : 0,
                virtual: fmt === 'virtual' ? 1 : 0,
                hybrid: fmt === 'hybrid' ? 1 : 0,
              },
              paidEventsCount: booking.eventType === 'paid' ? 1 : 0,
              freeEventsCount: booking.eventType === 'free' ? 1 : 0,
              lastEventDate: booking.date,
              firstEventDate: booking.date,
            },
            profileUpdatedAt: Timestamp.now(),
          },
          { merge: true }
        );
      });
    } catch (error) {
      // Non-critical: log but never throw — booking must not fail because of this
      console.error('[userProfileService] recordEventAttendance failed:', error);
    }
  },

  /**
   * Mark a user as checked in within their event history entry.
   * Called after a successful QR scan or manual check-in.
   */
  markCheckedIn: async (userId: string, eventId: string): Promise<void> => {
    if (!userId || userId.startsWith('manual_')) return;
    try {
      const historyRef = doc(
        db,
        `${COLLECTIONS.USER_EVENT_HISTORY}/${userId}/events`,
        eventId
      );
      await updateDoc(historyRef, {
        checkedIn: true,
        checkedInAt: Timestamp.now(),
      });
      // Increment total attended count on user doc
      const userRef = doc(db, COLLECTIONS.USERS, userId);
      await updateDoc(userRef, {
        'eventStats.totalAttended': increment(1),
      }).catch(() => {}); // silently ignore if doc not ready
    } catch (error) {
      console.error('[userProfileService] markCheckedIn failed:', error);
    }
  },

  /**
   * Save a user's interest tags, profession, and industry.
   * Recalculates profile completeness score.
   */
  updateInterests: async (
    userId: string,
    data: {
      interests?: string[];
      profession?: string;
      industry?: string;
    }
  ): Promise<void> => {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const existing = (await getDoc(userRef)).data() as AudienceProfile | undefined;
    const merged = { ...existing, ...data };
    const completeness = calculateProfileCompleteness(merged);

    await updateDoc(userRef, {
      ...data,
      profileCompleteness: completeness,
      profileUpdatedAt: Timestamp.now(),
    });
  },

  /**
   * Save the user's consent to receive organizer outreach.
   */
  updateConsent: async (userId: string, allow: boolean): Promise<void> => {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, {
      allowOrganizerContact: allow,
      profileUpdatedAt: Timestamp.now(),
    });
  },

  /**
   * Fetch a user's full event history (subcollection).
   */
  getEventHistory: async (userId: string): Promise<EventHistoryEntry[]> => {
    const historyRef = collection(
      db,
      `${COLLECTIONS.USER_EVENT_HISTORY}/${userId}/events`
    );
    const snap = await getDocs(query(historyRef, orderBy('registeredAt', 'desc')));
    return snap.docs.map((d) => d.data() as EventHistoryEntry);
  },

  /**
   * Audience query for organizers: find users who have attended events
   * in a given category and have consented to be contacted.
   * Returns up to 200 matching user profiles.
   */
  queryAudience: async (filters: {
    category?: string;
    venueTypePreference?: string;
    minEventsAttended?: number;
  }): Promise<Array<{ id: string } & AudienceProfile>> => {
    const usersRef = collection(db, COLLECTIONS.USERS);
    const constraints: any[] = [
      where('allowOrganizerContact', '==', true),
      limit(200),
    ];
    if (filters.category) {
      constraints.push(
        where(`eventStats.categoriesAttended.${filters.category}`, '>=', 1)
      );
    }
    const snap = await getDocs(query(usersRef, ...constraints));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as AudienceProfile) }));
  },

  /**
   * Admin: get aggregate audience stats across all users.
   */
  getAudienceStats: async (): Promise<{
    totalWithConsent: number;
    totalWithInterests: number;
    topCategories: Array<{ category: string; count: number }>;
  }> => {
    const usersRef = collection(db, COLLECTIONS.USERS);
    const consentSnap = await getDocs(
      query(usersRef, where('allowOrganizerContact', '==', true), limit(1000))
    );
    const interestsSnap = await getDocs(
      query(usersRef, where('interests', '!=', null), limit(1000))
    );

    // Aggregate category counts from all user eventStats
    const allUsers = await getDocs(query(usersRef, limit(1000)));
    const categoryCounts: Record<string, number> = {};
    allUsers.docs.forEach((d) => {
      const stats = (d.data() as AudienceProfile).eventStats;
      if (stats?.categoriesAttended) {
        Object.entries(stats.categoriesAttended).forEach(([cat, count]) => {
          categoryCounts[cat] = (categoryCounts[cat] || 0) + count;
        });
      }
    });
    const topCategories = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalWithConsent: consentSnap.size,
      totalWithInterests: interestsSnap.size,
      topCategories,
    };
  },
};
