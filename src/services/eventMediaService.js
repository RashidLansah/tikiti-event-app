// eventMediaService.js (mobile) — video discovery layer
// Manages the eventMedia collection from React Native.
// Videos are stored in Firebase Storage; metadata lives in Firestore.

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';

const COLLECTION = 'eventMedia';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function deriveEventStatus(eventDate) {
  const today = new Date().toISOString().split('T')[0];
  if (!eventDate) return 'upcoming';
  if (eventDate > today) return 'upcoming';
  if (eventDate === today) return 'live';
  return 'past';
}

function computeInitialRankScore(eventStatus) {
  switch (eventStatus) {
    case 'live':     return 100;
    case 'upcoming': return 50;
    case 'past':     return 5;
    default:         return 5;
  }
}

/**
 * Convert a local file URI to a Blob (required for Firebase Storage upload from RN).
 */
async function uriToBlob(uri) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response);
    xhr.onerror = () => reject(new Error('Failed to read video file'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

// ─── Service ──────────────────────────────────────────────────────────────────

const eventMediaService = {

  /**
   * Upload an attendee video and create an eventMedia document.
   * Returns the new Firestore document ID.
   *
   * @param {string} uri          - Local file URI from expo-image-picker
   * @param {object} metadata     - Event + user context fields
   * @param {function} onProgress - Optional callback receiving 0–100
   */
  uploadAttendeePost: async (uri, metadata, onProgress) => {
    // 1. Convert URI to blob
    const blob = await uriToBlob(uri);

    // 2. Upload to Firebase Storage
    const ext = uri.split('.').pop()?.split('?')[0] || 'mp4';
    const storagePath = `eventMedia/${metadata.eventId}/${metadata.userId}/${Date.now()}.${ext}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, blob);

    const videoUrl = await new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress?.(pct);
        },
        (error) => reject(error),
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        }
      );
    });

    // 3. Derive event status for ranking
    const eventStatus = deriveEventStatus(metadata.eventDate);
    const rankScore = computeInitialRankScore(eventStatus);

    // 4. Write Firestore document
    const docData = {
      eventId: metadata.eventId,
      userId: metadata.userId,
      bookingId: metadata.bookingId || null,
      type: 'attendee_post',
      mediaType: metadata.mediaType || 'video', // 'photo' | 'video'
      videoUrl,
      thumbnailUrl: null,
      storagePath,
      caption: metadata.caption || '',
      eventPhase: metadata.eventPhase || 'pre',
      verificationLevel: metadata.verificationLevel || 'has_ticket',

      // Denormalized event data for feed queries
      eventName: metadata.eventName || '',
      eventDate: metadata.eventDate || '',
      eventStatus,
      eventCategory: metadata.eventCategory || '',
      eventCity: metadata.eventCity || '',
      organizerId: metadata.organizerId || '',
      organizationId: metadata.organizationId || '',
      linkedUpcomingEventId: metadata.linkedUpcomingEventId || null,

      views: 0,
      likes: 0,
      rankScore,
      reported: false,
      hidden: false,
      reportCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, COLLECTION), docData);
    return docRef.id;
  },

  /**
   * Fetch attendee posts for an event, ranked.
   */
  getAttendeePosts: async (eventId, limitCount = 20) => {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('eventId', '==', eventId),
        where('type', '==', 'attendee_post'),
        where('hidden', '==', false),
        orderBy('rankScore', 'desc'),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch {
      return [];
    }
  },

  /**
   * Feed query: fetch ranked videos across events.
   * @param {object} filters - { eventStatuses?, eventCity?, limitCount? }
   */
  getFeedVideos: async (filters = {}) => {
    try {
      const constraints = [
        where('hidden', '==', false),
        orderBy('rankScore', 'desc'),
        limit(filters.limitCount || 20),
      ];

      if (filters.eventStatuses && filters.eventStatuses.length === 1) {
        constraints.unshift(where('eventStatus', '==', filters.eventStatuses[0]));
      }
      if (filters.eventCity) {
        constraints.unshift(where('eventCity', '==', filters.eventCity));
      }

      const q = query(collection(db, COLLECTION), ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch {
      return [];
    }
  },

  /**
   * Fetch all media for an event.
   */
  getByEvent: async (eventId) => {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('eventId', '==', eventId),
        where('hidden', '==', false),
        orderBy('rankScore', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch {
      return [];
    }
  },

  /**
   * Increment view count.
   */
  recordView: async (mediaId) => {
    try {
      await updateDoc(doc(db, COLLECTION, mediaId), {
        views: increment(1),
        updatedAt: Timestamp.now(),
      });
    } catch { /* silent */ }
  },

  /**
   * Toggle like.
   */
  toggleLike: async (mediaId, liked) => {
    try {
      await updateDoc(doc(db, COLLECTION, mediaId), {
        likes: increment(liked ? 1 : -1),
        updatedAt: Timestamp.now(),
      });
    } catch { /* silent */ }
  },

  /**
   * Report content.
   */
  report: async (mediaId) => {
    try {
      const docRef = doc(db, COLLECTION, mediaId);
      const snap = await getDoc(docRef);
      const data = snap.data();
      const newCount = (data?.reportCount || 0) + 1;
      await updateDoc(docRef, {
        reportCount: increment(1),
        reported: newCount >= 3,
        updatedAt: Timestamp.now(),
      });
    } catch { /* silent */ }
  },
};

export default eventMediaService;
