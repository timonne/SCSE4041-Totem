export type Page = 'overview' | 'setup' | 'history' | 'performance' | 'settings' | 'help' | 'ai' | 'interview' | 'report';
export type Theme = 'dark' | 'light' | 'system';
export type InterviewState = 'ready' | 'thinking' | 'complete';

export interface InterviewConfig {
  role: string;
  experience: string;
  type: string;
  difficulty: string;
  length: number;
  skills: string[];
  context: string;
  prompt_version?: string;
}

export interface Question {
  id?: number;
  text: string;
  category: string;
  difficulty?: string;
  followUp?: boolean;
  question_order?: number;
  status?: string;
}

export interface EvaluationData {
  id?: number;
  overall_score: number;
  technical_accuracy?: number;
  relevance?: number;
  clarity?: number;
  depth?: number;
  problem_solving?: number;
  communication?: number;
  summary?: string;
  strengths?: string[];
  missing_concepts?: string[];
  feedback: string;
  improved_answer?: string;
  follow_up_recommended?: boolean;
  follow_up_question?: string;
}

export interface Answer {
  question: Question;
  text: string;
  score: number;
  feedback: string;
  evaluation?: EvaluationData;
}

export interface Session {
  id: number;
  role: string;
  date: string;
  type: string;
  difficulty: string;
  score: number;
  questions: number;
  duration: string;
  status?: string;
}

export interface ReviewQuestion {
  q: string;
  score: number;
  answer: string;
  feedback: string;
  good: string[];
  missing: string[];
  improved: string;
}

export interface NextStep {
  num: string;
  title: string;
  priority: string;
  desc: string;
}

export interface ReportData {
  id: number;
  interview_id: number;
  overall_score: number;
  category_scores: Record<string, number>;
  summary: string;
  strengths: string[][];
  areas_for_improvement: string[][];
  study_topics: string[];
  next_steps: NextStep[];
  reviews: ReviewQuestion[];
  completion_stats?: {
    total_questions?: number;
    answered?: number;
    skipped?: number;
    duration?: string;
    completion_type?: string;
  };
  generated_at?: string;
}

export interface OverviewStatsData {
  total_interviews: number;
  interviews_completed: number;
  interviews_this_week: number;
  average_score: number;
  score_change_percent: string;
  highest_score: number;
  total_practice_time: string;
  improvement_points: string;
  recent_scores: number[];
  recommended_practice: Array<{ num: string; title: string; note: string }>;
}

export interface UserSettingsData {
  length: string;
  difficulty: string;
  type: string;
  experience: string;
  detail: boolean;
  samples: boolean;
  study: boolean;
  reduce: boolean;
  contrast: boolean;
  size: string;
  theme: Theme;
}
