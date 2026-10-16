/**
 * HTTP Client abstraction
 * Handles standard error formats: { error: { code, message, fields, requestId } }
 * Delegates to mock service when running client-side demo
 */

import { mockApi } from '../../mocks/mockService';

class ApiClient {
  constructor() {
    this.useMock = true; // Set by configuration
  }

  async get(endpoint, params = {}) {
    if (this.useMock) {
      return this.handleMockRoute('GET', endpoint, params);
    }
    // Real fetch implementation with credentials & CSRF
    const url = new URL(endpoint, window.location.origin);
    Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw await res.json();
    return res.json();
  }

  async post(endpoint, body = {}) {
    if (this.useMock) {
      return this.handleMockRoute('POST', endpoint, body);
    }
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    });
    if (!res.ok) throw await res.json();
    return res.json();
  }

  async put(endpoint, body = {}) {
    if (this.useMock) {
      return this.handleMockRoute('PUT', endpoint, body);
    }
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    });
    if (!res.ok) throw await res.json();
    return res.json();
  }

  // Routing mock calls to appropriate mockApi methods
  async handleMockRoute(method, endpoint, payload) {
    // Artificial small delay for realistic UX testing (50ms)
    await new Promise((r) => setTimeout(r, 60));

    if (endpoint === '/auth/me') return mockApi.getCurrentUser();
    if (endpoint === '/auth/switch-role') return mockApi.switchRole(payload.userId);
    if (endpoint === '/questions') {
      if (method === 'POST') return mockApi.createQuestion(payload);
      return mockApi.getQuestions(payload);
    }
    if (endpoint.startsWith('/questions/') && endpoint.endsWith('/status')) {
      const id = endpoint.split('/')[2];
      return mockApi.updateQuestionStatus(id, payload.status, payload.reason);
    }
    if (endpoint === '/assessments') {
      if (method === 'POST') return mockApi.createAssessment(payload);
      return mockApi.getAssessments();
    }
    if (endpoint.startsWith('/assessments/')) {
      const id = endpoint.split('/')[2];
      return mockApi.getAssessmentById(id);
    }
    if (endpoint === '/examinations') return mockApi.getExams();
    if (endpoint.startsWith('/examinations/')) {
      const id = endpoint.split('/')[2];
      return mockApi.getExamById(id);
    }
    if (endpoint === '/attempts/start') return mockApi.startAttempt(payload.examId, payload.userId);
    if (endpoint.startsWith('/attempts/') && !endpoint.includes('/')) {
      const id = endpoint.split('/')[2];
      return mockApi.getAttempt(id);
    }
    if (endpoint.includes('/attempts/') && endpoint.endsWith('/answers')) {
      const id = endpoint.split('/')[2];
      return mockApi.saveAnswer(id, payload.questionId, payload.answerValue);
    }
    if (endpoint.includes('/attempts/') && endpoint.endsWith('/submit')) {
      const id = endpoint.split('/')[2];
      return mockApi.submitAttempt(id, payload.idempotencyKey);
    }
    if (endpoint === '/practice/questions') return mockApi.getPracticeQuestions(payload);
    if (endpoint === '/grading/queue') return mockApi.getGradingQueue();
    if (endpoint.startsWith('/grading/scores/')) {
      const id = endpoint.split('/')[3];
      return mockApi.saveGradingScores(id, payload.rubrics, payload.feedback, payload.isFinal);
    }
    if (endpoint === '/courses') return mockApi.getCourses();
    if (endpoint.startsWith('/courses/')) {
      const id = endpoint.split('/')[2];
      return mockApi.getCourseById(id);
    }
    if (endpoint.includes('/lessons/') && endpoint.endsWith('/progress')) {
      return mockApi.updateLessonProgress(payload.courseId, payload.lessonId, payload.completed);
    }
    if (endpoint === '/knowledge') return mockApi.getArticles(payload);
    if (endpoint.startsWith('/knowledge/') && endpoint.endsWith('/save')) {
      const id = endpoint.split('/')[2];
      return mockApi.toggleSaveArticle(id);
    }
    if (endpoint === '/notifications') return mockApi.getNotifications();
    if (endpoint === '/notifications/mark-all-read') return mockApi.markAllNotificationsAsRead();
    if (endpoint === '/audit-logs') return mockApi.getAuditLogs();
    if (endpoint === '/catalog') return mockApi.getCatalog();

    return { data: null };
  }
}

export const apiClient = new ApiClient();
