// Engagement service for quizzes, polls, and surveys
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
import { Quiz, QuizResponse } from '@/types/engagement';

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

const COLLECTIONS = {
  EVENTS: 'events',
  QUIZZES: 'quizzes',
  RESPONSES: 'responses',
};

export const engagementService = {
  // Create quiz/poll
  createQuiz: async (eventId: string, quizData: Omit<Quiz, 'id'>): Promise<Quiz> => {
    try {
      // Clean undefined values before saving to Firebase
      const cleanedQuizData = cleanUndefinedValues(quizData);

      const quizzesRef = collection(db, COLLECTIONS.EVENTS, eventId, COLLECTIONS.QUIZZES);
      const quizRef = await addDoc(quizzesRef, {
        ...cleanedQuizData,
        createdAt: serverTimestamp(),
      });
      return { id: quizRef.id, ...quizData };
    } catch (error) {
      console.error('Error creating quiz:', error);
      throw error;
    }
  },

  // Get quiz by ID
  getQuizById: async (eventId: string, quizId: string): Promise<Quiz | null> => {
    try {
      const quizRef = doc(db, COLLECTIONS.EVENTS, eventId, COLLECTIONS.QUIZZES, quizId);
      const quizSnap = await getDoc(quizRef);
      
      if (quizSnap.exists()) {
        return { id: quizSnap.id, ...quizSnap.data() } as Quiz;
      }
      return null;
    } catch (error) {
      console.error('Error getting quiz:', error);
      throw error;
    }
  },

  // Get all quizzes for an event
  getQuizzesByEvent: async (eventId: string): Promise<Quiz[]> => {
    try {
      const quizzesRef = collection(db, COLLECTIONS.EVENTS, eventId, COLLECTIONS.QUIZZES);
      const q = query(quizzesRef, orderBy('createdAt', 'desc'));
      const quizzesSnapshot = await getDocs(q);
      
      const quizzes: Quiz[] = [];
      quizzesSnapshot.forEach((doc) => {
        quizzes.push({ id: doc.id, ...doc.data() } as Quiz);
      });
      
      return quizzes;
    } catch (error) {
      console.error('Error getting quizzes:', error);
      throw error;
    }
  },

  // Update quiz
  updateQuiz: async (
    eventId: string,
    quizId: string,
    updates: Partial<Quiz>
  ): Promise<void> => {
    try {
      // Clean undefined values before updating
      const cleanedUpdates = cleanUndefinedValues(updates);

      const quizRef = doc(db, COLLECTIONS.EVENTS, eventId, COLLECTIONS.QUIZZES, quizId);
      await updateDoc(quizRef, {
        ...cleanedUpdates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating quiz:', error);
      throw error;
    }
  },

  // Delete quiz
  deleteQuiz: async (eventId: string, quizId: string): Promise<void> => {
    try {
      const quizRef = doc(db, COLLECTIONS.EVENTS, eventId, COLLECTIONS.QUIZZES, quizId);
      await deleteDoc(quizRef);
    } catch (error) {
      console.error('Error deleting quiz:', error);
      throw error;
    }
  },

  // Start quiz (change status to active)
  startQuiz: async (eventId: string, quizId: string): Promise<void> => {
    try {
      const quizRef = doc(db, COLLECTIONS.EVENTS, eventId, COLLECTIONS.QUIZZES, quizId);
      await updateDoc(quizRef, {
        status: 'active',
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error starting quiz:', error);
      throw error;
    }
  },

  // Get quiz responses
  getQuizResponses: async (eventId: string, quizId: string): Promise<QuizResponse[]> => {
    try {
      const responsesRef = collection(
        db,
        COLLECTIONS.EVENTS,
        eventId,
        COLLECTIONS.QUIZZES,
        quizId,
        COLLECTIONS.RESPONSES
      );
      const q = query(responsesRef, orderBy('submittedAt', 'desc'));
      const responsesSnapshot = await getDocs(q);
      
      const responses: QuizResponse[] = [];
      responsesSnapshot.forEach((doc) => {
        responses.push({ id: doc.id, ...doc.data() } as QuizResponse);
      });
      
      return responses;
    } catch (error) {
      console.error('Error getting quiz responses:', error);
      throw error;
    }
  },

  // Submit quiz response
  submitResponse: async (
    eventId: string,
    quizId: string,
    response: Omit<QuizResponse, 'id'>
  ): Promise<QuizResponse> => {
    try {
      // Clean undefined values before saving
      const cleanedResponse = cleanUndefinedValues(response);

      const responsesRef = collection(
        db,
        COLLECTIONS.EVENTS,
        eventId,
        COLLECTIONS.QUIZZES,
        quizId,
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
