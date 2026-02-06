'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { organizationService, Organization, OrganizationMember } from '@/lib/services/organizationService';

interface UserProfile {
  accountType?: 'user' | 'organiser';
  displayName?: string;
  email?: string;
  photoURL?: string;
  organizationId?: string;
  currentOrganizationRole?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  currentOrganization: Organization | null;
  currentOrgRole: string | null;
  currentOrgPermissions: string[];
  organizations: (Organization & { role: string; permissions: string[] })[];
  
  // Auth methods
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, displayName: string, profileData?: Partial<UserProfile>) => Promise<any>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  
  // Profile methods
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  
  // Organization methods
  switchOrganization: (orgId: string) => Promise<void>;
  createOrganization: (orgData: Partial<Organization>) => Promise<Organization>;
  refreshOrganizations: () => Promise<void>;
  
  // Computed properties
  isAuthenticated: boolean;
  hasOrganization: boolean;
  isOrganizationOwner: boolean;
  isOrganizationAdmin: boolean;
  isProjectManager: boolean;
  isGateStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Organization state
  const [organizations, setOrganizations] = useState<(Organization & { role: string; permissions: string[] })[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [currentOrgRole, setCurrentOrgRole] = useState<string | null>(null);
  const [currentOrgPermissions, setCurrentOrgPermissions] = useState<string[]>([]);

  useEffect(() => {
    // Only initialize auth state listener on client side
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    // Check if auth is properly initialized (has currentUser property)
    try {
      if (!auth || typeof onAuthStateChanged !== 'function') {
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Firebase auth not initialized:', error);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Fetch user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const profileData = userDoc.data() as UserProfile;
            setUserProfile(profileData);
            
            // Load organizations for this user
            try {
              const userOrgs = await organizationService.getByMember(firebaseUser.uid);
              setOrganizations(userOrgs);
              
              // Set current organization if user has one
              if (profileData.organizationId && userOrgs.length > 0) {
                const defaultOrg = userOrgs.find(org => org.id === profileData.organizationId) || userOrgs[0];
                // Load organization and member info synchronously
                const org = await organizationService.getById(defaultOrg.id!);
                const member = await organizationService.getMember(defaultOrg.id!, firebaseUser.uid);
                if (org && member && member.status === 'active') {
                  setCurrentOrganization(org);
                  setCurrentOrgRole(member.role);
                  setCurrentOrgPermissions(member.permissions || []);
                }
              } else if (userOrgs.length > 0) {
                // Use first organization if no default is set
                const org = await organizationService.getById(userOrgs[0].id!);
                const member = await organizationService.getMember(userOrgs[0].id!, firebaseUser.uid);
                if (org && member && member.status === 'active') {
                  setCurrentOrganization(org);
                  setCurrentOrgRole(member.role);
                  setCurrentOrgPermissions(member.permissions || []);
                }
              }
            } catch (orgError) {
              console.error('Error loading organizations:', orgError);
              // Don't block auth flow if org loading fails
            }
          } else {
            // Set a default profile to prevent indefinite loading
            setUserProfile({ 
              accountType: 'user', 
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || undefined
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserProfile({ 
            accountType: 'user', 
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || undefined
          });
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setOrganizations([]);
        setCurrentOrganization(null);
        setCurrentOrgRole(null);
        setCurrentOrgPermissions([]);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []); // Empty deps array - only run once on mount

  // Login
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register
  const register = async (
    email: string,
    password: string,
    displayName: string,
    profileData?: Partial<UserProfile>
  ) => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Update display name
      if (displayName) {
        await firebaseUpdateProfile(userCredential.user, { displayName });
      }

      // Create user profile in Firestore
      const userRef = doc(db, 'users', userCredential.user.uid);
      const newUserProfile = {
        ...profileData,
        accountType: profileData?.accountType || 'user',
        displayName,
        email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(userRef, newUserProfile);

      // Immediately set the user state so createOrganization can use it
      // (onAuthStateChanged will also fire, but this ensures immediate availability)
      setUser(userCredential.user);
      setUserProfile(newUserProfile as UserProfile);

      return userCredential;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
      setOrganizations([]);
      setCurrentOrganization(null);
      setCurrentOrgRole(null);
      setCurrentOrgPermissions([]);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    try {
      // Use auth.currentUser directly for consistency
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User must be authenticated');

      const userRef = doc(db, 'users', currentUser.uid);
      const updatedData = {
        ...userProfile,
        ...updates,
        updatedAt: serverTimestamp()
      };

      await updateDoc(userRef, updatedData);
      setUserProfile(updatedData as UserProfile);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  // Switch organization
  const switchOrganization = async (orgId: string) => {
    try {
      // Use auth.currentUser directly for consistency with createOrganization
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User must be authenticated');

      const org = await organizationService.getById(orgId);
      if (!org) {
        throw new Error('Organization not found');
      }

      // Get member info for current user
      const member = await organizationService.getMember(orgId, currentUser.uid);
      if (!member || member.status !== 'active') {
        throw new Error('You are not an active member of this organization');
      }

      setCurrentOrganization(org);
      setCurrentOrgRole(member.role);
      setCurrentOrgPermissions(member.permissions || []);

      // Update user profile with current organization
      await updateUserProfile({
        organizationId: orgId,
        currentOrganizationRole: member.role
      });

      console.log('✅ Switched to organization:', org.name, 'Role:', member.role);
    } catch (error) {
      console.error('Error switching organization:', error);
      throw error;
    }
  };

  // Create organization
  const createOrganization = async (orgData: Partial<Organization>): Promise<Organization> => {
    try {
      // Use auth.currentUser directly to ensure we have the correct authenticated user
      // This is important because React state (user) may not be in sync with Firebase Auth
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('User must be authenticated');

      const org = await organizationService.create(orgData, currentUser.uid);

      // Refresh organizations list
      const userOrgs = await organizationService.getByMember(currentUser.uid);
      setOrganizations(userOrgs);

      // Switch to newly created organization
      await switchOrganization(org.id!);

      // Send welcome email to admin (fire and forget, don't block org creation)
      try {
        await fetch('/api/email/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: currentUser.email,
            name: userProfile?.displayName || currentUser.displayName || 'Admin',
            orgName: org.name
          })
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't throw - email failure shouldn't block org creation
      }

      return org;
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  };

  // Refresh organizations list
  const refreshOrganizations = async () => {
    try {
      if (!user) return;

      const userOrgs = await organizationService.getByMember(user.uid);
      setOrganizations(userOrgs);

      // Also set current organization if user has one in profile but none loaded
      if (userOrgs.length > 0 && !currentOrganization) {
        const defaultOrgId = userProfile?.organizationId;
        const defaultOrg = defaultOrgId
          ? userOrgs.find(org => org.id === defaultOrgId) || userOrgs[0]
          : userOrgs[0];

        const org = await organizationService.getById(defaultOrg.id!);
        const member = await organizationService.getMember(defaultOrg.id!, user.uid);
        if (org && member && member.status === 'active') {
          setCurrentOrganization(org);
          setCurrentOrgRole(member.role);
          setCurrentOrgPermissions(member.permissions || []);
        }
      }
    } catch (error) {
      console.error('Error refreshing organizations:', error);
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    currentOrganization,
    currentOrgRole,
    currentOrgPermissions,
    organizations,
    login,
    register,
    logout,
    resetPassword,
    updateUserProfile,
    switchOrganization,
    createOrganization,
    refreshOrganizations,
    isAuthenticated: !!user,
    hasOrganization: organizations.length > 0,
    isOrganizationOwner: currentOrgRole === 'owner',
    isOrganizationAdmin: currentOrgRole === 'admin' || currentOrgRole === 'owner',
    isProjectManager: currentOrgRole === 'project_manager' || currentOrgRole === 'admin' || currentOrgRole === 'owner',
    isGateStaff: currentOrgRole === 'gate_staff',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
