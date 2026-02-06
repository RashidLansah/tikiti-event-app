// Survey service for post-event feedback collection
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
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Survey, SurveyResponse } from '@/types/engagement';

const COLLECTIONS = {
  EVENTS: 'events',
  SURVEYS: 'surveys',
  RESPONSES: 'responses',
};

// Helper function to recursively remove undefined values from objects
const deepCleanUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return undefined;
  }
  if (Array.isArray(obj)) {
    const cleaned = obj.map(deepCleanUndefined).filter(item => item !== undefined);
    return cleaned.length > 0 ? cleaned : undefined;
  }
  if (typeof obj === 'object' && obj.constructor === Object) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const cleanedValue = deepCleanUndefined(value);
      if (cleanedValue !== undefined) {
        cleaned[key] = cleanedValue;
      }
    }
    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }
  return obj;
};

export const surveyService = {
  // Create survey
  createSurvey: async (eventId: string, surveyData: Omit<Survey, 'id'>): Promise<Survey> => {
    try {
      // Clean undefined values before saving
      const cleanedSurveyData = deepCleanUndefined(surveyData);
      
      const surveysRef = collection(db, COLLECTIONS.EVENTS, eventId, COLLECTIONS.SURVEYS);
      const surveyRef = await addDoc(surveysRef, {
        ...cleanedSurveyData,
        eventId,
        createdAt: serverTimestamp(),
      });
      return { id: surveyRef.id, ...surveyData };
    } catch (error) {
      console.error('Error creating survey:', error);
      throw error;
    }
  },

  // Get survey by ID
  getSurveyById: async (eventId: string, surveyId: string): Promise<Survey | null> => {
    try {
      const surveyRef = doc(db, COLLECTIONS.EVENTS, eventId, COLLECTIONS.SURVEYS, surveyId);
      const surveySnap = await getDoc(surveyRef);
      
      if (surveySnap.exists()) {
        return { id: surveySnap.id, ...surveySnap.data() } as Survey;
      }
      return null;
    } catch (error) {
      console.error('Error getting survey:', error);
      throw error;
    }
  },

  // Get all surveys for an event
  getSurveysByEvent: async (eventId: string): Promise<Survey[]> => {
    try {
      const surveysRef = collection(db, COLLECTIONS.EVENTS, eventId, COLLECTIONS.SURVEYS);
      const q = query(surveysRef, orderBy('createdAt', 'desc'));
      const surveysSnapshot = await getDocs(q);
      
      const surveys: Survey[] = [];
      surveysSnapshot.forEach((doc) => {
        surveys.push({ id: doc.id, ...doc.data() } as Survey);
      });
      
      return surveys;
    } catch (error) {
      console.error('Error getting surveys:', error);
      throw error;
    }
  },

  // Update survey
  updateSurvey: async (
    eventId: string,
    surveyId: string,
    updates: Partial<Survey>
  ): Promise<void> => {
    try {
      // Clean undefined values before updating
      const cleanedUpdates = deepCleanUndefined(updates);
      
      const surveyRef = doc(db, COLLECTIONS.EVENTS, eventId, COLLECTIONS.SURVEYS, surveyId);
      await updateDoc(surveyRef, {
        ...cleanedUpdates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating survey:', error);
      throw error;
    }
  },

  // Delete survey
  deleteSurvey: async (eventId: string, surveyId: string): Promise<void> => {
    try {
      const surveyRef = doc(db, COLLECTIONS.EVENTS, eventId, COLLECTIONS.SURVEYS, surveyId);
      await deleteDoc(surveyRef);
    } catch (error) {
      console.error('Error deleting survey:', error);
      throw error;
    }
  },

  // Publish survey (change status to active)
  publishSurvey: async (eventId: string, surveyId: string): Promise<void> => {
    try {
      const surveyRef = doc(db, COLLECTIONS.EVENTS, eventId, COLLECTIONS.SURVEYS, surveyId);
      await updateDoc(surveyRef, {
        status: 'active',
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error publishing survey:', error);
      throw error;
    }
  },

  // Close survey (change status to closed)
  closeSurvey: async (eventId: string, surveyId: string): Promise<void> => {
    try {
      const surveyRef = doc(db, COLLECTIONS.EVENTS, eventId, COLLECTIONS.SURVEYS, surveyId);
      await updateDoc(surveyRef, {
        status: 'closed',
        closedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error closing survey:', error);
      throw error;
    }
  },

  // Get survey responses
  getSurveyResponses: async (eventId: string, surveyId: string): Promise<SurveyResponse[]> => {
    try {
      const responsesRef = collection(
        db,
        COLLECTIONS.EVENTS,
        eventId,
        COLLECTIONS.SURVEYS,
        surveyId,
        COLLECTIONS.RESPONSES
      );
      const q = query(responsesRef, orderBy('submittedAt', 'desc'));
      const responsesSnapshot = await getDocs(q);
      
      const responses: SurveyResponse[] = [];
      responsesSnapshot.forEach((doc) => {
        responses.push({ id: doc.id, ...doc.data() } as SurveyResponse);
      });
      
      return responses;
    } catch (error) {
      console.error('Error getting survey responses:', error);
      throw error;
    }
  },

  // Submit survey response
  submitResponse: async (
    eventId: string,
    surveyId: string,
    response: Omit<SurveyResponse, 'id'>
  ): Promise<SurveyResponse> => {
    try {
      // Clean undefined values before saving
      const cleanedResponse = deepCleanUndefined(response);
      
      const responsesRef = collection(
        db,
        COLLECTIONS.EVENTS,
        eventId,
        COLLECTIONS.SURVEYS,
        surveyId,
        COLLECTIONS.RESPONSES
      );
      const responseRef = await addDoc(responsesRef, {
        ...cleanedResponse,
        submittedAt: serverTimestamp(),
      });
      return { id: responseRef.id, ...response };
    } catch (error) {
      console.error('Error submitting response:', error);
      throw error;
    }
  },
};
