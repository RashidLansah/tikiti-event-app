// userProfileService.js — audience intelligence data layer (mobile)
// Mirrors the web dashboard's userProfileService.ts.
// Silently tracks event attendance per user to build rich profiles over time.
// All writes are fire-and-forget — they NEVER block or throw.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  increment,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ─── Collections ─────────────────────────────────────────────────────────────

const USERS = 'users';
const USER_EVENT_HISTORY = 'userEventHistory';

// ─── Interest + Industry Options (shown on profile screen) ───────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveTagsFromCategory(category = '') {
  const map = {
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

function calculateProfileCompleteness(profile = {}) {
  let score = 0;
  if (profile.interests && profile.interests.length > 0) score += 30;
  if (profile.profession) score += 25;
  if (profile.industry) score += 25;
  if (profile.allowOrganizerContact !== undefined) score += 20;
  return score;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const userProfileService = {
  /**
   * Called silently after every successful booking.
   * Records the event in the user's history and updates aggregate stats.
   * Never throws — booking must not fail because of this.
   *
   * @param {string} userId - Firebase UID
   * @param {object} booking - { bookingId, eventId, eventName, category, venueType, eventType, date, location, organizationId }
   */
  recordEventAttendance: async (userId, booking) => {
    if (!userId || userId.startsWith('manual_')) return;

    try {
      const entry = {
        eventId: booking.eventId,
        eventName: booking.eventName || '',
        category: booking.category || 'Other',
        venueType: booking.venueType || 'in_person',
        eventType: booking.eventType || 'free',
        date: booking.date || '',
        location: booking.location || '',
        organizationId: booking.organizationId || '',
        bookingId: booking.bookingId,
        registeredAt: serverTimestamp(),
        checkedIn: false,
        tags: deriveTagsFromCategory(booking.category),
      };

      // Write to userEventHistory/{userId}/events/{eventId}
      const historyRef = doc(
        db,
        `${USER_EVENT_HISTORY}/${userId}/events`,
        booking.eventId
      );
      await setDoc(historyRef, entry, { merge: true });

      // Update aggregate stats on users/{userId}
      const fmt = booking.venueType || 'in_person';
      const statsUpdate = {
        [`eventStats.totalRegistered`]: increment(1),
        [`eventStats.categoriesAttended.${booking.category || 'Other'}`]: increment(1),
        [`eventStats.lastEventDate`]: booking.date || '',
        profileUpdatedAt: serverTimestamp(),
      };

      if (['in_person', 'virtual', 'hybrid'].includes(fmt)) {
        statsUpdate[`eventStats.formatBreakdown.${fmt}`] = increment(1);
      }

      if (booking.eventType === 'paid') {
        statsUpdate['eventStats.paidEventsCount'] = increment(1);
      } else {
        statsUpdate['eventStats.freeEventsCount'] = increment(1);
      }

      const userRef = doc(db, USERS, userId);
      await updateDoc(userRef, statsUpdate).catch(async () => {
        // First time — initialise the eventStats field
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
              freeEventsCount: booking.eventType !== 'paid' ? 1 : 0,
              lastEventDate: booking.date || '',
              firstEventDate: booking.date || '',
            },
            profileUpdatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      });
    } catch (error) {
      // Non-critical — log only
      console.warn('[userProfileService] recordEventAttendance failed:', error);
    }
  },

  /**
   * Called after a successful check-in (QR scan or manual).
   * Updates the history entry and increments totalAttended.
   *
   * @param {string} userId
   * @param {string} eventId
   */
  markCheckedIn: async (userId, eventId) => {
    if (!userId || userId.startsWith('manual_')) return;
    try {
      const historyRef = doc(db, `${USER_EVENT_HISTORY}/${userId}/events`, eventId);
      await setDoc(historyRef, { checkedIn: true, checkedInAt: serverTimestamp() }, { merge: true });

      const userRef = doc(db, USERS, userId);
      await updateDoc(userRef, {
        'eventStats.totalAttended': increment(1),
      }).catch(() => {});
    } catch (error) {
      console.warn('[userProfileService] markCheckedIn failed:', error);
    }
  },

  /**
   * Save the user's interest tags, profession, and industry.
   * Recalculates profile completeness score.
   *
   * @param {string} userId
   * @param {{ interests?: string[], profession?: string, industry?: string }} data
   */
  updateInterests: async (userId, data) => {
    try {
      const userRef = doc(db, USERS, userId);
      const snap = await getDoc(userRef);
      const existing = snap.exists() ? snap.data() : {};
      const merged = { ...existing, ...data };
      const completeness = calculateProfileCompleteness(merged);

      await updateDoc(userRef, {
        ...data,
        profileCompleteness: completeness,
        profileUpdatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.warn('[userProfileService] updateInterests failed:', error);
      throw error; // this one is user-initiated — surface the error
    }
  },

  /**
   * Save the user's consent to receive organizer outreach.
   *
   * @param {string} userId
   * @param {boolean} allow
   */
  updateConsent: async (userId, allow) => {
    try {
      const userRef = doc(db, USERS, userId);
      await updateDoc(userRef, {
        allowOrganizerContact: allow,
        profileUpdatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.warn('[userProfileService] updateConsent failed:', error);
      throw error;
    }
  },

  /**
   * Fetch the user's full event attendance history.
   *
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  getEventHistory: async (userId) => {
    try {
      const historyRef = collection(db, `${USER_EVENT_HISTORY}/${userId}/events`);
      const snap = await getDocs(query(historyRef, orderBy('registeredAt', 'desc')));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.warn('[userProfileService] getEventHistory failed:', error);
      return [];
    }
  },
};
