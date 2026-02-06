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

const COLLECTION = 'invitations';

export interface Invitation {
  id?: string;
  token: string;
  email: string;
  organizationId: string;
  organizationName: string;
  role: 'admin' | 'project_manager' | 'gate_staff';
  invitedBy: string;
  inviterName: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  createdAt?: any;
  expiresAt: any;
  acceptedAt?: any;
  acceptedBy?: string;
}

export const invitationService = {
  /**
   * Create a new invitation
   */
  create: async (data: {
    email: string;
    organizationId: string;
    organizationName: string;
    role: Invitation['role'];
    invitedBy: string;
    inviterName: string;
  }): Promise<Invitation> => {
    try {
      // Check if there's already a pending invitation for this email and org
      const existingQuery = query(
        collection(db, COLLECTION),
        where('email', '==', data.email.toLowerCase()),
        where('organizationId', '==', data.organizationId),
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

      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const invitationData: Omit<Invitation, 'id'> = {
        token,
        email: data.email.toLowerCase(),
        organizationId: data.organizationId,
        organizationName: data.organizationName,
        role: data.role,
        invitedBy: data.invitedBy,
        inviterName: data.inviterName,
        status: 'pending',
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
      };

      const docRef = await addDoc(collection(db, COLLECTION), invitationData);

      return { id: docRef.id, ...invitationData };
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw error;
    }
  },

  /**
   * Get invitation by token
   */
  getByToken: async (token: string): Promise<Invitation | null> => {
    try {
      const q = query(collection(db, COLLECTION), where('token', '==', token));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Invitation;
    } catch (error) {
      console.error('Error getting invitation by token:', error);
      throw error;
    }
  },

  /**
   * Get all invitations for an organization
   */
  getByOrganization: async (organizationId: string): Promise<Invitation[]> => {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('organizationId', '==', organizationId)
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Invitation[];
    } catch (error) {
      console.error('Error getting invitations:', error);
      throw error;
    }
  },

  /**
   * Accept an invitation
   */
  accept: async (token: string, userId: string): Promise<Invitation> => {
    try {
      const invitation = await invitationService.getByToken(token);

      if (!invitation) {
        throw new Error('Invitation not found');
      }

      if (invitation.status !== 'pending') {
        throw new Error(`Invitation has already been ${invitation.status}`);
      }

      // Check if expired
      const now = new Date();
      const expiresAt = invitation.expiresAt.toDate
        ? invitation.expiresAt.toDate()
        : new Date(invitation.expiresAt);

      if (now > expiresAt) {
        await updateDoc(doc(db, COLLECTION, invitation.id!), {
          status: 'expired',
        });
        throw new Error('Invitation has expired');
      }

      // Update invitation status
      await updateDoc(doc(db, COLLECTION, invitation.id!), {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
        acceptedBy: userId,
      });

      return {
        ...invitation,
        status: 'accepted',
        acceptedBy: userId,
      };
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  },

  /**
   * Cancel an invitation
   */
  cancel: async (invitationId: string): Promise<void> => {
    try {
      await updateDoc(doc(db, COLLECTION, invitationId), {
        status: 'cancelled',
      });
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      throw error;
    }
  },

  /**
   * Resend an invitation (creates new token)
   */
  resend: async (invitationId: string): Promise<Invitation> => {
    try {
      const inviteRef = doc(db, COLLECTION, invitationId);
      const inviteSnap = await getDoc(inviteRef);

      if (!inviteSnap.exists()) {
        throw new Error('Invitation not found');
      }

      const oldInvite = inviteSnap.data() as Invitation;

      // Cancel old invitation
      await updateDoc(inviteRef, { status: 'cancelled' });

      // Create new invitation with same details
      return invitationService.create({
        email: oldInvite.email,
        organizationId: oldInvite.organizationId,
        organizationName: oldInvite.organizationName,
        role: oldInvite.role,
        invitedBy: oldInvite.invitedBy,
        inviterName: oldInvite.inviterName,
      });
    } catch (error) {
      console.error('Error resending invitation:', error);
      throw error;
    }
  },

  /**
   * Delete an invitation
   */
  delete: async (invitationId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, COLLECTION, invitationId));
    } catch (error) {
      console.error('Error deleting invitation:', error);
      throw error;
    }
  },
};

export default invitationService;
