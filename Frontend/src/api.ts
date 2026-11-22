import type {
  Answer,
  InterviewConfig,
  OverviewStatsData,
  Question,
  ReportData,
  Session,
  UserSettingsData,
} from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiService {
  private url(endpoint: string): string {
    return `${BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(this.url(endpoint), config);
      if (!response.ok) {
        let errMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errData = await response.json();
          if (errData && errData.detail) {
            errMessage = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
          }
        } catch {
          // Keep default status text
        }
        throw new Error(errMessage);
      }
      return (await response.json()) as T;
    } catch (err: any) {
      console.warn(`API request to ${endpoint} failed:`, err.message);
      throw err;
    }
  }

  // Health
  async getHealth() {
    return this.request<{
      status: string;
      version: string;
      database_connected: boolean;
      ai_provider: string;
      ai_model: string;
      ai_provider_configured: boolean;
    }>('/api/health');
  }

  // Interview Sessions
  async createInterview(config: InterviewConfig) {
    return this.request<{
      id: number;
      role: string;
      experience: string;
      type: string;
      difficulty: string;
      length: number;
      skills: string[];
      context: string;
      status: string;
      current_question_index: number;
      questions: Question[];
    }>('/api/interviews', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async getInterviews(params?: { search?: string; type?: string; sort?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.type && params.type !== 'All types') query.append('type', params.type);
    if (params?.sort) query.append('sort', params.sort);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<Session[]>(`/api/interviews${qs}`);
  }

  async getInterview(id: number) {
    return this.request<{
      id: number;
      role: string;
      experience: string;
      type: string;
      difficulty: string;
      length: number;
      skills: string[];
      context: string;
      status: string;
      current_question_index: number;
      questions: Question[];
      duration_seconds?: number;
      overall_score?: number;
    }>(`/api/interviews/${id}`);
  }

  async startInterview(id: number) {
    return this.request<Question>(`/api/interviews/${id}/start`, {
      method: 'POST',
    });
  }

  async getCurrentQuestion(id: number) {
    return this.request<Question>(`/api/interviews/${id}/current-question`);
  }

  async submitAnswer(interviewId: number, questionId: number, answerText: string, elapsedSeconds: number = 0) {
    return this.request<{
      interview_id: number;
      completed: boolean;
      status: string;
      evaluation: {
        overall_score: number;
        feedback: string;
        strengths: string[];
        missing_concepts: string[];
        improved_answer?: string;
        follow_up_recommended: boolean;
        follow_up_question?: string;
      };
      next_question: Question | null;
      current_question_index: number;
      total_questions: number;
      difficulty_adjusted?: string;
      is_follow_up: boolean;
    }>(`/api/interviews/${interviewId}/answers`, {
      method: 'POST',
      body: JSON.stringify({
        question_id: questionId,
        answer_text: answerText,
        elapsed_seconds: elapsedSeconds,
      }),
    });
  }

  async skipQuestion(interviewId: number) {
    return this.request<{
      interview_id: number;
      completed: boolean;
      status: string;
      evaluation: any;
      next_question: Question | null;
      current_question_index: number;
      total_questions: number;
    }>(`/api/interviews/${interviewId}/skip`, {
      method: 'POST',
    });
  }

  async endInterview(interviewId: number) {
    return this.request<{ message: string; report_id: number; interview_id: number }>(
      `/api/interviews/${interviewId}/end`,
      { method: 'POST' }
    );
  }

  // Reports
  async getReport(interviewId: number) {
    return this.request<ReportData>(`/api/interviews/${interviewId}/report`);
  }

  async generateReport(interviewId: number) {
    return this.request<ReportData>(`/api/interviews/${interviewId}/report/generate`, {
      method: 'POST',
    });
  }

  // Analytics
  async getOverviewAnalytics() {
    return this.request<OverviewStatsData>('/api/analytics/overview');
  }

  async getProgressionAnalytics(range: string = '30 days') {
    return this.request<{
      labels: string[];
      scores: number[];
      trend_description: string;
      improvement_points: number;
    }>(`/api/analytics/progression?range=${encodeURIComponent(range)}`);
  }

  async getCategoryAnalytics() {
    return this.request<{
      categories: Record<string, number>;
      radar_labels: string[];
    }>('/api/analytics/categories');
  }

  async getInterviewTypeAnalytics() {
    return this.request<{
      distribution: Array<{ type: string; percentage: string; count: number }>;
      total_sessions: number;
    }>('/api/analytics/interview-types');
  }

  async getInsightsAnalytics() {
    return this.request<{
      strongest_category: { category: string; average: string };
      focus_area: { category: string; average: string };
      most_improved: { category: string; points: string };
      suggested_next: { topic: string; detail: string };
    }>('/api/analytics/insights');
  }

  // Settings
  async getSettings() {
    return this.request<UserSettingsData>('/api/settings');
  }

  async updateSettings(settings: Partial<UserSettingsData>) {
    return this.request<UserSettingsData>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Prompt Comparison
  async getPromptComparison() {
    return this.request<any>('/api/prompts/comparison');
  }

  async testPrompt(version: string, role: string, questionText: string, candidateAnswer: string) {
    return this.request<any>('/api/prompts/test', {
      method: 'POST',
      body: JSON.stringify({
        version,
        role,
        question_text: questionText,
        candidate_answer: candidateAnswer,
      }),
    });
  }
}

export const api = new ApiService();
