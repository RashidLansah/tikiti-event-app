// eventMediaService.ts — video discovery layer
// Manages the eventMedia collection: organizer promo videos + attendee posts.
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
  Timestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { db, storage } from '../firebase/config';

// ─── Collection ──────────────────────────────────────────────────────────────

const COLLECTION = 'eventMedia';

// ─── Types ───────────────────────────────────────────────────────────────────

export type MediaType = 'organizer_promo' | 'attendee_post';
export type EventPhase = 'pre' | 'live' | 'post';
export type VerificationLevel = 'organizer' | 'checked_in' | 'has_ticket' | 'unverified';
export type EventStatus = 'upcoming' | 'live' | 'past';

export interface EventMedia {
  id?: string;
  eventId: string;
  userId: string;
  bookingId?: string;
  type: MediaType;

  // Storage
  videoUrl: string;
  thumbnailUrl?: string;
  storagePath: string; // Firebase Storage path for deletion

  // Content
  caption?: string;
  eventPhase: EventPhase;
  verificationLevel: VerificationLevel;

  // Denormalized from event (critical — enables feed queries without joins)
  eventName: string;
  eventDate: string; // YYYY-MM-DD
  eventStatus: EventStatus;
  eventCategory: string;
  eventCity: string;
  organizerId: string;
  organizationId: string;
  linkedUpcomingEventId?: string; // for past content → forward link

  // Metrics (updated by server-side logic, not client)
  views: number;
  likes: number;
  rankScore: number; // pre-computed ranking weight

  // Moderation
  reported: boolean;
  hidden: boolean;
  reportCount: number;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deriveEventStatus(eventDate: string): EventStatus {
  const today = new Date().toISOString().split('T')[0];
  if (eventDate > today) return 'upcoming';
  if (eventDate === today) return 'live';
  return 'past';
}

/**
 * v1 rank score calculation (pure client-side, written at upload time).
 * A Cloud Function will refresh this periodically with fresher signals.
 */
function computeInitialRankScore(eventStatus: EventStatus): number {
  switch (eventStatus) {
    case 'live':     return 100;
    case 'upcoming': return 50;
    case 'past':     return 5;
    default:         return 5;
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const eventMediaService = {

  /**
   * Upload a video file to Firebase Storage and create an eventMedia document.
   * Returns the new document ID.
   *
   * @param file        - The video File object
   * @param metadata    - All required fields except videoUrl/storagePath (set after upload)
   * @param onProgress  - Optional upload progress callback (0–100)
   */
  uploadVideo: async (
    file: File,
    metadata: Omit<EventMedia, 'id' | 'videoUrl' | 'storagePath' | 'views' | 'likes' | 'rankScore' | 'reported' | 'hidden' | 'reportCount' | 'createdAt' | 'updatedAt' | 'eventStatus'>,
    onProgress?: (pct: number) => void
  ): Promise<string> => {
    // 1. Validate
    if (!file.type.startsWith('video/')) {
      throw new Error('Please select a video file');
    }
    const MAX_MB = 200;
    if (file.size > MAX_MB * 1024 * 1024) {
      throw new Error(`Video must be under ${MAX_MB}MB`);
    }

    // 2. Upload to Firebase Storage
    const storagePath = `eventMedia/${metadata.eventId}/${metadata.userId}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    const videoUrl: string = await new Promise((resolve, reject) => {
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
    const docData: Omit<EventMedia, 'id'> = {
      ...metadata,
      videoUrl,
      storagePath,
      eventStatus,
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
   * Fetch all media for a single event, ordered by rankScore descending.
   */
  getByEvent: async (eventId: string): Promise<EventMedia[]> => {
    const q = query(
      collection(db, COLLECTION),
      where('eventId', '==', eventId),
      where('hidden', '==', false),
      orderBy('rankScore', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as EventMedia));
  },

  /**
   * Fetch only the organizer promo video for an event (at most one).
   */
  getOrganizerPromo: async (eventId: string): Promise<EventMedia | null> => {
    const q = query(
      collection(db, COLLECTION),
      where('eventId', '==', eventId),
      where('type', '==', 'organizer_promo'),
      where('hidden', '==', false),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() } as EventMedia;
  },

  /**
   * Fetch attendee posts for an event.
   */
  getAttendeePosts: async (eventId: string, limitCount = 20): Promise<EventMedia[]> => {
    const q = query(
      collection(db, COLLECTION),
      where('eventId', '==', eventId),
      where('type', '==', 'attendee_post'),
      where('hidden', '==', false),
      orderBy('rankScore', 'desc'),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as EventMedia));
  },

  /**
   * Feed query: fetch ranked videos across events in given categories/city.
   * Used by the mobile feed. Filters hidden content and respects rankScore.
   */
  getFeedVideos: async (filters: {
    categories?: string[];
    eventCity?: string;
    eventStatuses?: EventStatus[];
    limitCount?: number;
  }): Promise<EventMedia[]> => {
    const constraints: any[] = [
      where('hidden', '==', false),
      orderBy('rankScore', 'desc'),
      limit(filters.limitCount || 30),
    ];

    if (filters.eventStatuses && filters.eventStatuses.length === 1) {
      constraints.unshift(where('eventStatus', '==', filters.eventStatuses[0]));
    }
    if (filters.eventCity) {
      constraints.unshift(where('eventCity', '==', filters.eventCity));
    }

    const q = query(collection(db, COLLECTION), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as EventMedia));
  },

  /**
   * Increment view count on a media document.
   */
  recordView: async (mediaId: string): Promise<void> => {
    await updateDoc(doc(db, COLLECTION, mediaId), {
      views: increment(1),
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Toggle like on a media document.
   */
  toggleLike: async (mediaId: string, liked: boolean): Promise<void> => {
    await updateDoc(doc(db, COLLECTION, mediaId), {
      likes: increment(liked ? 1 : -1),
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Report a media document (increment reportCount, flag if threshold reached).
   */
  report: async (mediaId: string): Promise<void> => {
    const docRef = doc(db, COLLECTION, mediaId);
    const snap = await getDoc(docRef);
    const data = snap.data();
    const newCount = (data?.reportCount || 0) + 1;
    await updateDoc(docRef, {
      reportCount: increment(1),
      reported: newCount >= 3, // auto-flag at 3 reports
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Admin: hide a media document.
   */
  hide: async (mediaId: string): Promise<void> => {
    await updateDoc(doc(db, COLLECTION, mediaId), {
      hidden: true,
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Admin: unhide a media document.
   */
  unhide: async (mediaId: string): Promise<void> => {
    await updateDoc(doc(db, COLLECTION, mediaId), {
      hidden: false,
      reported: false,
      reportCount: 0,
      updatedAt: Timestamp.now(),
    });
  },

  /**
   * Delete media: removes Storage file and Firestore document.
   */
  delete: async (mediaId: string): Promise<void> => {
    const docRef = doc(db, COLLECTION, mediaId);
    const snap = await getDoc(docRef);
    const data = snap.data() as EventMedia | undefined;

    // Delete from Storage first
    if (data?.storagePath) {
      try {
        await deleteObject(ref(storage, data.storagePath));
      } catch {
        // Storage object may already be gone — continue with Firestore deletion
      }
    }

    // Delete Firestore document
    await updateDoc(docRef, { hidden: true, updatedAt: Timestamp.now() });
  },

  /**
   * Admin: fetch all reported media for moderation review.
   */
  getReported: async (): Promise<EventMedia[]> => {
    const q = query(
      collection(db, COLLECTION),
      where('reported', '==', true),
      where('hidden', '==', false),
      orderBy('reportCount', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as EventMedia));
  },
};
