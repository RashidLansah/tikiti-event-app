// Organization service for web dashboard
// This will use the same service structure as mobile app but adapted for web

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
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTIONS = {
  ORGANIZATIONS: 'organizations',
  MEMBERS: 'members'
};

// Helper function to remove undefined values from objects
const cleanUndefinedValues = <T extends Record<string, any>>(obj: T): Partial<T> => {
  const cleaned: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
};

// Helper function to generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Helper function to get permissions for role
function getPermissionsForRole(role: string): string[] {
  const permissions: Record<string, string[]> = {
    owner: [
      'manage_organization',
      'manage_members',
      'manage_subscription',
      'manage_events',
      'manage_programs',
      'manage_quizzes',
      'manage_surveys',
      'manage_messaging',
      'view_analytics',
      'export_data',
      'scan_tickets'
    ],
    admin: [
      'manage_members',
      'manage_events',
      'manage_programs',
      'manage_quizzes',
      'manage_surveys',
      'manage_messaging',
      'view_analytics',
      'export_data',
      'scan_tickets'
    ],
    project_manager: [
      'manage_events',
      'manage_programs',
      'manage_quizzes',
      'manage_surveys',
      'manage_messaging',
      'view_analytics',
      'scan_tickets'
    ],
    gate_staff: [
      'scan_tickets',
      'view_attendees'
    ]
  };

  return permissions[role] || permissions.project_manager;
}

export interface Organization {
  id?: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  subscription: {
    plan: 'free' | 'starter' | 'pro' | 'enterprise';
    status: 'active' | 'trial' | 'expired';
    startDate: any;
    endDate: any;
  };
  settings: {
    branding: {
      logo?: string | null;
      primaryColor?: string | null;
      secondaryColor?: string | null;
    };
    notifications: {
      emailNotifications: boolean;
      pushNotifications: boolean;
      smsNotifications: boolean;
    };
  };
  createdAt?: any;
  updatedAt?: any;
}

export interface OrganizationMember {
  id?: string;
  userId: string;
  role: 'owner' | 'admin' | 'project_manager' | 'gate_staff';
  permissions: string[];
  invitedBy: string;
  joinedAt: any;
  status: 'active' | 'pending' | 'suspended';
}

export const organizationService = {
  // Create organization
  create: async (orgData: Partial<Organization>, ownerId: string): Promise<Organization> => {
    try {
      const slug = generateSlug(orgData.name || '');
      
      // Check if slug already exists
      const existingOrgsRef = collection(db, COLLECTIONS.ORGANIZATIONS);
      const slugQuery = query(existingOrgsRef, where('slug', '==', slug));
      const existingOrgs = await getDocs(slugQuery);
      
      let finalSlug = slug;
      if (!existingOrgs.empty) {
        finalSlug = `${slug}-${Math.random().toString(36).substr(2, 6)}`;
      }

      const orgDataWithDefaults: Omit<Organization, 'id'> = {
        name: (orgData.name || '').trim(),
        slug: finalSlug,
        email: orgData.email?.trim() || '',
        phone: orgData.phone?.trim() || '',
        subscription: {
          plan: 'free',
          status: 'active',
          startDate: serverTimestamp(),
          endDate: null
        },
        settings: {
          branding: {
            logo: null,
            primaryColor: null,
            secondaryColor: null
          },
          notifications: {
            emailNotifications: true,
            pushNotifications: true,
            smsNotifications: false
          }
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Create organization document
      const orgsRef = collection(db, COLLECTIONS.ORGANIZATIONS);
      const orgRef = await addDoc(orgsRef, orgDataWithDefaults);
      const orgId = orgRef.id;

      // Add owner as member with 'owner' role
      await organizationService.addMember(orgId, ownerId, 'owner', ownerId);

      // Update user profile to link to organization
      const userRef = doc(db, 'users', ownerId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          organizationId: orgId,
          updatedAt: serverTimestamp()
        });
      }

      return { id: orgId, ...orgDataWithDefaults };
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  },

  // Get organization by ID
  getById: async (orgId: string): Promise<Organization | null> => {
    try {
      const orgRef = doc(db, COLLECTIONS.ORGANIZATIONS, orgId);
      const orgSnap = await getDoc(orgRef);
      
      if (orgSnap.exists()) {
        return { id: orgSnap.id, ...orgSnap.data() } as Organization;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting organization:', error);
      throw error;
    }
  },

  // Get organizations by member (user)
  getByMember: async (userId: string): Promise<(Organization & { role: string; permissions: string[] })[]> => {
    try {
      const orgsRef = collection(db, COLLECTIONS.ORGANIZATIONS);
      const orgsSnapshot = await getDocs(orgsRef);
      
      const orgPromises = orgsSnapshot.docs.map(async (orgDoc) => {
        const membersRef = collection(db, COLLECTIONS.ORGANIZATIONS, orgDoc.id, COLLECTIONS.MEMBERS);
        const memberRef = doc(membersRef, userId);
        const memberSnap = await getDoc(memberRef);
        
        if (memberSnap.exists()) {
          const memberData = memberSnap.data();
          if (memberData.status === 'active') {
            return {
              id: orgDoc.id,
              ...orgDoc.data(),
              role: memberData.role,
              permissions: memberData.permissions || []
            } as Organization & { role: string; permissions: string[] };
          }
        }
        return null;
      });
      
      const results = await Promise.all(orgPromises);
      return results.filter(org => org !== null) as (Organization & { role: string; permissions: string[] })[];
    } catch (error) {
      console.error('Error getting organizations by member:', error);
      throw error;
    }
  },

  // Update organization
  update: async (orgId: string, updates: Partial<Organization>): Promise<void> => {
    try {
      // Clean undefined values before updating
      const cleanedUpdates = cleanUndefinedValues(updates);

      const orgRef = doc(db, COLLECTIONS.ORGANIZATIONS, orgId);
      await updateDoc(orgRef, {
        ...cleanedUpdates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating organization:', error);
      throw error;
    }
  },

  // Add member to organization
  addMember: async (orgId: string, userId: string, role: string, invitedBy: string): Promise<OrganizationMember> => {
    try {
      // Import auth to check current user
      const { auth } = await import('../firebase/config');

      console.log('Current auth state:', {
        currentUser: auth.currentUser?.uid,
        targetUserId: userId,
        match: auth.currentUser?.uid === userId
      });

      const membersRef = collection(db, COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.MEMBERS);
      const memberRef = doc(membersRef, userId);

      const memberData: Omit<OrganizationMember, 'id'> = {
        userId,
        role: role as OrganizationMember['role'],
        permissions: getPermissionsForRole(role),
        invitedBy,
        joinedAt: serverTimestamp(),
        status: 'active'
      };

      console.log('Adding member with data:', {
        orgId,
        memberId: userId,
        memberData,
        memberRefPath: memberRef.path
      });

      await setDoc(memberRef, memberData);
      return { id: memberRef.id, ...memberData };
    } catch (error) {
      console.error('Error adding member to organization:', error);
      throw error;
    }
  },

  // Get organization members
  getMembers: async (orgId: string): Promise<(OrganizationMember & { userProfile?: any })[]> => {
    try {
      const membersRef = collection(db, COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.MEMBERS);
      const membersSnapshot = await getDocs(membersRef);
      
      const members = [];
      for (const memberDoc of membersSnapshot.docs) {
        const memberData = memberDoc.data() as OrganizationMember;
        
        // Fetch user profile
        const userRef = doc(db, 'users', memberData.userId);
        const userSnap = await getDoc(userRef);
        const userProfile = userSnap.exists() ? userSnap.data() : null;
        
        members.push({
          id: memberDoc.id,
          ...memberData,
          userProfile: {
            displayName: userProfile?.displayName || '',
            email: userProfile?.email || userProfile?.email || '',
            photoURL: userProfile?.photoURL || null
          }
        });
      }
      
      return members;
    } catch (error) {
      console.error('Error getting organization members:', error);
      throw error;
    }
  },

  // Get member by userId
  getMember: async (orgId: string, userId: string): Promise<OrganizationMember | null> => {
    try {
      const membersRef = collection(db, COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.MEMBERS);
      const memberRef = doc(membersRef, userId);
      const memberSnap = await getDoc(memberRef);
      
      if (memberSnap.exists()) {
        return { id: memberSnap.id, ...memberSnap.data() } as OrganizationMember;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting member:', error);
      throw error;
    }
  }
};

export default organizationService;
