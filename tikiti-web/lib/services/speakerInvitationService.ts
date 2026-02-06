// Speaker invitation service for inviting speakers/panelists to events

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
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { v4 as uuidv4 } from 'uuid';
import {
  SpeakerInvitation,
  CreateSpeakerInvitationData,
} from '@/types/speakerInvitation';

const COLLECTION = 'speakerInvitations';

export const speakerInvitationService = {
  /**
   * Create a new speaker invitation
   */
  create: async (
    data: CreateSpeakerInvitationData
  ): Promise<SpeakerInvitation> => {
    try {
      // Check if there's already a pending invitation for this email and event
      const existingQuery = query(
        collection(db, COLLECTION),
        where('email', '==', data.email.toLowerCase()),
        where('eventId', '==', data.eventId),
        where('status', '==', 'pending')
      );
      const existingInvites = await getDocs(existingQuery);

      if (!existingInvites.empty) {
        // Cancel existing invitation
        const existingDoc = existingInvites.docs[0];
        await updateDoc(doc(db, COLLECTION, existingDoc.id), {
          status: 'cancelled',
        });
      }

      // Generate unique token
      const token = uuidv4();

      // Set expiration to 14 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 14);

      // Build invitation data, excluding undefined values (Firebase doesn't accept undefined)
      const invitationData: Record<string, any> = {
        token,
        email: data.email.toLowerCase(),
        eventId: data.eventId,
        eventName: data.eventName,
        organizationId: data.organizationId,
        organizationName: data.organizationName,
        role: data.role,
        invitedBy: data.invitedBy,
        inviterName: data.inviterName,
        status: 'pending',
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
      };

      // Only add optional fields if they have values
      if (data.speakerName) invitationData.speakerName = data.speakerName;
      if (data.sessionId) invitationData.sessionId = data.sessionId;
      if (data.sessionTitle) invitationData.sessionTitle = data.sessionTitle;
      if (data.message) invitationData.message = data.message;

      const docRef = await addDoc(collection(db, COLLECTION), invitationData);

      return { id: docRef.id, ...invitationData };
    } catch (error) {
      console.error('Error creating speaker invitation:', error);
      throw error;
    }
  },

  /**
   * Get invitation by token
   */
  getByToken: async (token: string): Promise<SpeakerInvitation | null> => {
    try {
      const q = query(collection(db, COLLECTION), where('token', '==', token));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as SpeakerInvitation;
    } catch (error) {
      console.error('Error getting invitation by token:', error);
      throw error;
    }
  },

  /**
   * Get invitations by event
   */
  getByEvent: async (eventId: string): Promise<SpeakerInvitation[]> => {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('eventId', '==', eventId)
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as SpeakerInvitation)
      );
    } catch (error) {
      console.error('Error getting invitations by event:', error);
      throw error;
    }
  },

  /**
   * Get invitations by organization
   */
  getByOrganization: async (
    organizationId: string
  ): Promise<SpeakerInvitation[]> => {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('organizationId', '==', organizationId)
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as SpeakerInvitation)
      );
    } catch (error) {
      console.error('Error getting invitations by organization:', error);
      throw error;
    }
  },

  /**
   * Mark invitation as submitted (profile completed)
   */
  markSubmitted: async (
    invitationId: string,
    speakerId: string
  ): Promise<void> => {
    try {
      const docRef = doc(db, COLLECTION, invitationId);
      await updateDoc(docRef, {
        status: 'submitted',
        speakerId,
        submittedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error marking invitation as submitted:', error);
      throw error;
    }
  },

  /**
   * Cancel invitation
   */
  cancel: async (invitationId: string): Promise<void> => {
    try {
      const docRef = doc(db, COLLECTION, invitationId);
      await updateDoc(docRef, {
        status: 'cancelled',
      });
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      throw error;
    }
  },

  /**
   * Resend invitation (creates new token)
   */
  resend: async (invitationId: string): Promise<SpeakerInvitation> => {
    try {
      // Get existing invitation
      const docRef = doc(db, COLLECTION, invitationId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Invitation not found');
      }

      const existingData = docSnap.data() as SpeakerInvitation;

      // Cancel the existing invitation
      await updateDoc(docRef, {
        status: 'cancelled',
      });

      // Create new invitation with fresh token
      return speakerInvitationService.create({
        email: existingData.email,
        speakerName: existingData.speakerName,
        eventId: existingData.eventId,
        eventName: existingData.eventName,
        sessionId: existingData.sessionId,
        sessionTitle: existingData.sessionTitle,
        organizationId: existingData.organizationId,
        organizationName: existingData.organizationName,
        role: existingData.role,
        invitedBy: existingData.invitedBy,
        inviterName: existingData.inviterName,
        message: existingData.message,
      });
    } catch (error) {
      console.error('Error resending invitation:', error);
      throw error;
    }
  },

  /**
   * Delete invitation
   */
  delete: async (invitationId: string): Promise<void> => {
    try {
      const docRef = doc(db, COLLECTION, invitationId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting invitation:', error);
      throw error;
    }
  },

  /**
   * Check if invitation is expired
   */
  isExpired: (invitation: SpeakerInvitation): boolean => {
    if (!invitation.expiresAt) return false;

    const expiresAt =
      invitation.expiresAt instanceof Timestamp
        ? invitation.expiresAt.toDate()
        : new Date(invitation.expiresAt);

    return expiresAt < new Date();
  },
};
