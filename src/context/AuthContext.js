import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { authService } from '../services/authService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Fetch user profile from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const profileData = userDoc.data();
            console.log('🔍 Fetched user profile:', profileData);
            setUserProfile(profileData);
          } else {
            console.log('⚠️ No user profile found for:', firebaseUser.uid);
            // Set a default profile to prevent indefinite loading
            setUserProfile({ 
              accountType: 'user', 
              email: firebaseUser.email,
              displayName: firebaseUser.displayName 
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Set a default profile on error to prevent indefinite loading
          setUserProfile({ 
            accountType: 'user', 
            email: firebaseUser.email,
            displayName: firebaseUser.displayName 
          });
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const createUserProfile = async (userId, profileData) => {
    try {
      console.log('📝 Creating user profile for:', userId, 'with data:', profileData);
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        ...profileData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('✅ User profile created successfully');
      setUserProfile(profileData);
      
      // Force a small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const updatedData = {
        ...userProfile,
        ...updates,
        updatedAt: new Date(),
      };
      
      await setDoc(userRef, updatedData, { merge: true });
      setUserProfile(updatedData);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };



  const loginUser = async (email, password) => {
    try {
      setLoading(true);
      const userCredential = await authService.login(email, password);
      // User state will be updated by onAuthStateChanged
      return userCredential;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (email, password, displayName, profileData) => {
    try {
      setLoading(true);
      const user = await authService.register(email, password, displayName);
      
      // Create user profile in Firestore
      await createUserProfile(user.uid, profileData);
      
      return user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    try {
      await authService.resetPassword(email);
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    login: loginUser,
    register: registerUser,
    logout,
    resetPassword,
    createUserProfile,
    updateUserProfile,
    isAuthenticated: !!user,
    isOrganizer: userProfile?.accountType === 'organiser',
    isUser: userProfile?.accountType === 'user' || !userProfile?.accountType,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};