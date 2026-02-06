// Quizzes, Polls, and Surveys types

export type QuizType = 'quiz' | 'poll';

export type QuestionType = 
  | 'multiple_choice' 
  | 'true_false' 
  | 'rating' 
  | 'text';

export interface QuizQuestion {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[]; // For multiple choice
  correctAnswer?: any; // For quizzes
  points?: number; // For quizzes
}

export type TriggerType = 
  | 'manual' 
  | 'scheduled' 
  | 'session_end' 
  | 'program';

export interface QuizTrigger {
  type: TriggerType;
  scheduledTime?: any; // timestamp
  sessionId?: string;
  programTrigger?: string;
}

export interface QuizSettings {
  showResults: boolean;
  allowMultipleAttempts: boolean;
  timeLimit?: number; // seconds
}

export type QuizStatus = 'draft' | 'active' | 'completed';

export interface Quiz {
  id?: string;
  title: string;
  description?: string;
  type: QuizType;
  questions: QuizQuestion[];
  trigger: QuizTrigger;
  status: QuizStatus;
  settings: QuizSettings;
  createdAt?: any;
  startedAt?: any;
  completedAt?: any;
}

export interface QuizResponse {
  id?: string;
  userId: string;
  userName: string;
  answers: Array<{
    questionId: string;
    answer: any;
    isCorrect?: boolean; // For quizzes
    points?: number; // For quizzes
  }>;
  totalScore?: number; // For quizzes
  submittedAt?: any;
}

// Survey types
export type SurveyStatus = 'draft' | 'active' | 'closed';

export interface SurveyQuestion {
  id: string;
  question: string;
  type: 'text' | 'rating' | 'multiple_choice' | 'checkbox' | 'scale' | 'nps';
  required: boolean;
  options?: string[]; // For multiple_choice and checkbox
  min?: number; // For scale and rating
  max?: number; // For scale and rating
  labels?: {
    min?: string;
    max?: string;
  }; // For scale
}

export interface Survey {
  id?: string;
  title: string;
  description?: string;
  questions: SurveyQuestion[];
  status: SurveyStatus;
  eventId: string;
  settings: {
    allowAnonymous: boolean;
    oneResponsePerUser: boolean;
    showProgress: boolean;
  };
  createdAt?: any;
  publishedAt?: any;
  closedAt?: any;
}

export interface SurveyResponse {
  id?: string;
  userId?: string; // Optional for anonymous responses
  userName?: string;
  email?: string;
  answers: Array<{
    questionId: string;
    answer: any;
  }>;
  submittedAt?: any;
}
