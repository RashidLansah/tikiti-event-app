// Speaker service for managing event speakers, panelists, moderators, etc.

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
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Speaker } from '@/types/speaker';

const COLLECTION = 'speakers';

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

export const speakerService = {
  /**
   * Create a new speaker
   */
  create: async (
    data: Omit<Speaker, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Speaker> => {
    try {
      // Build speaker data, excluding undefined values (Firebase doesn't accept undefined)
      const speakerData: Record<string, any> = {
        name: data.name,
        email: data.email.toLowerCase(),
        organizationId: data.organizationId,
        status: data.status,
        createdBy: data.createdBy,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Only add optional fields if they have values
      if (data.jobTitle) speakerData.jobTitle = data.jobTitle;
      if (data.company) speakerData.company = data.company;
      if (data.bio) speakerData.bio = data.bio;
      if (data.photoBase64) speakerData.photoBase64 = data.photoBase64;
      if (data.photoUrl) speakerData.photoUrl = data.photoUrl;
      if (data.linkedInUrl) speakerData.linkedInUrl = data.linkedInUrl;
      if (data.twitterHandle) speakerData.twitterHandle = data.twitterHandle;
      if (data.websiteUrl) speakerData.websiteUrl = data.websiteUrl;

      const docRef = await addDoc(collection(db, COLLECTION), speakerData);

      return { id: docRef.id, ...speakerData } as Speaker;
    } catch (error) {
      console.error('Error creating speaker:', error);
      throw error;
    }
  },

  /**
   * Get speaker by ID
   */
  getById: async (speakerId: string): Promise<Speaker | null> => {
    try {
      const docRef = doc(db, COLLECTION, speakerId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return { id: docSnap.id, ...docSnap.data() } as Speaker;
    } catch (error) {
      console.error('Error getting speaker:', error);
      throw error;
    }
  },

  /**
   * Get speakers by organization
   */
  getByOrganization: async (organizationId: string): Promise<Speaker[]> => {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('organizationId', '==', organizationId)
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Speaker)
      );
    } catch (error) {
      console.error('Error getting speakers by organization:', error);
      throw error;
    }
  },

  /**
   * Get speakers by email (for finding existing speaker profiles)
   */
  getByEmail: async (
    email: string,
    organizationId: string
  ): Promise<Speaker | null> => {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('email', '==', email.toLowerCase()),
        where('organizationId', '==', organizationId)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Speaker;
    } catch (error) {
      console.error('Error getting speaker by email:', error);
      throw error;
    }
  },

  /**
   * Get multiple speakers by IDs
   */
  getByIds: async (speakerIds: string[]): Promise<Speaker[]> => {
    try {
      if (speakerIds.length === 0) return [];

      const speakers: Speaker[] = [];
      for (const id of speakerIds) {
        const speaker = await speakerService.getById(id);
        if (speaker) {
          speakers.push(speaker);
        }
      }
      return speakers;
    } catch (error) {
      console.error('Error getting speakers by IDs:', error);
      throw error;
    }
  },

  /**
   * Update speaker
   */
  update: async (
    speakerId: string,
    data: Partial<Omit<Speaker, 'id' | 'createdAt'>>
  ): Promise<void> => {
    try {
      const docRef = doc(db, COLLECTION, speakerId);
      const cleanedData = cleanUndefinedValues(data);
      await updateDoc(docRef, {
        ...cleanedData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating speaker:', error);
      throw error;
    }
  },

  /**
   * Delete speaker
   */
  delete: async (speakerId: string): Promise<void> => {
    try {
      const docRef = doc(db, COLLECTION, speakerId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting speaker:', error);
      throw error;
    }
  },

  /**
   * Update speaker profile (for public submission)
   */
  updateProfile: async (
    speakerId: string,
    profileData: {
      name: string;
      jobTitle?: string;
      company?: string;
      bio?: string;
      photoBase64?: string;
      linkedInUrl?: string;
      twitterHandle?: string;
      websiteUrl?: string;
    }
  ): Promise<void> => {
    try {
      const docRef = doc(db, COLLECTION, speakerId);
      const cleanedData = cleanUndefinedValues(profileData);
      await updateDoc(docRef, {
        ...cleanedData,
        status: 'profile_submitted',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating speaker profile:', error);
      throw error;
    }
  },

  /**
   * Activate speaker (after organizer review)
   */
  activate: async (speakerId: string): Promise<void> => {
    try {
      const docRef = doc(db, COLLECTION, speakerId);
      await updateDoc(docRef, {
        status: 'active',
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error activating speaker:', error);
      throw error;
    }
  },
};
