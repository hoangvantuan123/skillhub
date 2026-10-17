import React, { lazy, Suspense } from 'react';
import LoadingPage from '../shared/ui/LoadingPage';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import WorkspaceLayout from '../layouts/WorkspaceLayout';
import AuthLayout from '../layouts/AuthLayout';
import ExamLayout from '../layouts/ExamLayout';

// Features
const LoginPage = lazy(() => import('../features/auth').then(module => ({ default: module.LoginPage })));
const AccessDeniedPage = lazy(() => import('../features/auth').then(module => ({ default: module.AccessDeniedPage })));
const DashboardPage = lazy(() => import('../features/dashboard').then(module => ({ default: module.DashboardPage })));
const QuestionListPage = lazy(() => import('../features/questions').then(module => ({ default: module.QuestionListPage })));
const QuestionEditorPage = lazy(() => import('../features/questions').then(module => ({ default: module.QuestionEditorPage })));
const AssessmentListPage = lazy(() => import('../features/assessments').then(module => ({ default: module.AssessmentListPage })));
const AssessmentEditorPage = lazy(() => import('../features/assessments').then(module => ({ default: module.AssessmentEditorPage })));
const ExamBlueprintConfigPage = lazy(() => import('../features/assessments').then(module => ({ default: module.ExamBlueprintConfigPage })));
const ExamListPage = lazy(() => import('../features/examinations').then(module => ({ default: module.ExamListPage })));
const ExamDetailPage = lazy(() => import('../features/examinations').then(module => ({ default: module.ExamDetailPage })));
const CandidateExamLoginPage = lazy(() => import('../features/examinations').then(module => ({ default: module.CandidateExamLoginPage })));
const ExamLobbyPage = lazy(() => import('../features/attempts').then(module => ({ default: module.ExamLobbyPage })));
const AttemptPage = lazy(() => import('../features/attempts').then(module => ({ default: module.AttemptPage })));
const SubmissionReceiptPage = lazy(() => import('../features/attempts').then(module => ({ default: module.SubmissionReceiptPage })));
const PracticeSetupPage = lazy(() => import('../features/practice').then(module => ({ default: module.PracticeSetupPage })));
const PracticePlayerPage = lazy(() => import('../features/practice').then(module => ({ default: module.PracticePlayerPage })));
const GradingQueuePage = lazy(() => import('../features/grading').then(module => ({ default: module.GradingQueuePage })));
const GradingDetailPage = lazy(() => import('../features/grading').then(module => ({ default: module.GradingDetailPage })));
const CourseListPage = lazy(() => import('../features/learning').then(module => ({ default: module.CourseListPage })));
const LessonPage = lazy(() => import('../features/learning').then(module => ({ default: module.LessonPage })));
const KnowledgePage = lazy(() => import('../features/knowledge').then(module => ({ default: module.KnowledgePage })));
const ReportsPage = lazy(() => import('../features/reports').then(module => ({ default: module.ReportsPage })));
const GroupsPage = lazy(() => import('../features/organization').then(module => ({ default: module.GroupsPage })));
const UserManagementPage = lazy(() => import('../features/organization').then(module => ({ default: module.UserManagementPage })));
const CatalogPage = lazy(() => import('../features/catalog').then(module => ({ default: module.CatalogPage })));
const SettingsPage = lazy(() => import('../features/settings').then(module => ({ default: module.SettingsPage })));
const NotificationsPage = lazy(() => import('../features/notifications').then(module => ({ default: module.NotificationsPage })));

const LevelPolicyPage = lazy(() => import('../features/examinations/pages/LevelPolicyPage'));
const ModulePermissionsPage = lazy(() => import('../features/security/pages/ModulePermissionsPage'));

// 404 Not Found Component
function NotFoundPage() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--navy)' }}>404</h1>
      <p style={{ color: 'var(--navy-muted)', margin: '8px 0 20px' }}>
        Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
      </p>
      <a
        href="/app"
        style={{
          display: 'inline-block',
          background: 'var(--color-primary-600)',
          color: '#ffffff',
          padding: '10px 18px',
          borderRadius: '8px',
          fontWeight: '600',
        }}
      >
        Về trang tổng quan
      </a>
    </div>
  );
}

export const router = createBrowserRouter([
  // Root redirect
  {
    path: '/',
    element: <Navigate to="/app" replace />,
  },

  // Auth Layout routes
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <Suspense fallback={<LoadingPage />}><LoginPage /></Suspense> },
      { path: '/access-denied', element: <Suspense fallback={<LoadingPage />}><AccessDeniedPage /></Suspense> },
      { path: '/exam-entry', element: <Suspense fallback={<LoadingPage />}><CandidateExamLoginPage /></Suspense> },
      { path: '/exam/login', element: <Suspense fallback={<LoadingPage />}><CandidateExamLoginPage /></Suspense> },
    ],
  },

  // Focused Exam Taking Layout (Distraction-free)
  {
    element: <ExamLayout />,
    children: [
      { path: '/exam/attempts/:attemptId', element: <Suspense fallback={<LoadingPage />}><AttemptPage /></Suspense> },
    ],
  },

  // Main Workspace Layout
  {
    element: <WorkspaceLayout />,
    children: [
      { path: '/app', element: <Suspense fallback={<LoadingPage />}><DashboardPage /></Suspense> },

      // Learning & Courses
      { path: '/app/learning', element: <Suspense fallback={<LoadingPage />}><CourseListPage /></Suspense> },
      { path: '/app/learning/:courseId/lessons/:lessonId', element: <Suspense fallback={<LoadingPage />}><LessonPage /></Suspense> },

      // Knowledge Base
      { path: '/app/knowledge', element: <Suspense fallback={<LoadingPage />}><KnowledgePage /></Suspense> },

      // Practice
      { path: '/app/practice', element: <Suspense fallback={<LoadingPage />}><PracticeSetupPage /></Suspense> },
      { path: '/app/practice/player', element: <Suspense fallback={<LoadingPage />}><PracticePlayerPage /></Suspense> },

      // Candidate Exams
      { path: '/app/exams', element: <Suspense fallback={<LoadingPage />}><ExamListPage /></Suspense> },
      { path: '/app/exams/:examId', element: <Suspense fallback={<LoadingPage />}><ExamDetailPage /></Suspense> },
      { path: '/app/exams/:examId/lobby', element: <Suspense fallback={<LoadingPage />}><ExamLobbyPage /></Suspense> },

      // Results & Receipts
      { path: '/app/results/:attemptId', element: <Suspense fallback={<LoadingPage />}><SubmissionReceiptPage /></Suspense> },

      // Questions Management
      { path: '/manage/questions', element: <Suspense fallback={<LoadingPage />}><QuestionListPage /></Suspense> },
      { path: '/manage/questions/new', element: <Suspense fallback={<LoadingPage />}><QuestionEditorPage /></Suspense> },
      { path: '/manage/questions/:id/edit', element: <Suspense fallback={<LoadingPage />}><QuestionEditorPage /></Suspense> },

      // Assessments Management
      { path: '/manage/assessments', element: <Suspense fallback={<LoadingPage />}><AssessmentListPage /></Suspense> },
      { path: '/manage/assessments/new', element: <Suspense fallback={<LoadingPage />}><AssessmentEditorPage /></Suspense> },
      { path: '/manage/assessments/:id', element: <Suspense fallback={<LoadingPage />}><AssessmentEditorPage /></Suspense> },
      { path: '/manage/blueprints', element: <Suspense fallback={<LoadingPage />}><ExamBlueprintConfigPage /></Suspense> },
      { path: '/manage/assessments/settings', element: <Suspense fallback={<LoadingPage />}><ExamBlueprintConfigPage /></Suspense> },

      // Exam Management
      { path: '/manage/exams', element: <Suspense fallback={<LoadingPage />}><ExamListPage /></Suspense> },

      // Grading Management
      { path: '/manage/grading', element: <Suspense fallback={<LoadingPage />}><GradingQueuePage /></Suspense> },
      { path: '/manage/grading/:submissionId', element: <Suspense fallback={<LoadingPage />}><GradingDetailPage /></Suspense> },

      // Groups & Organization & Users
      { path: '/manage/groups', element: <Suspense fallback={<LoadingPage />}><GroupsPage /></Suspense> },
      { path: '/manage/levels', element: <Suspense fallback={<LoadingPage />}><LevelPolicyPage /></Suspense> },
      { path: '/admin/modules', element: <Suspense fallback={<LoadingPage />}><ModulePermissionsPage /></Suspense> },
      { path: '/admin/users', element: <Suspense fallback={<LoadingPage />}><UserManagementPage /></Suspense> },

      // Reports
      { path: '/manage/reports', element: <Suspense fallback={<LoadingPage />}><ReportsPage /></Suspense> },

      // Admin & Catalog
      { path: '/admin/catalog', element: <Suspense fallback={<LoadingPage />}><CatalogPage /></Suspense> },
      { path: '/app/settings', element: <Suspense fallback={<LoadingPage />}><SettingsPage /></Suspense> },
      { path: '/admin/settings', element: <Navigate to="/app/settings" replace /> },

      // Notifications Center
      { path: '/notifications', element: <Suspense fallback={<LoadingPage />}><NotificationsPage /></Suspense> },

      // 404 Fallback inside Workspace
      { path: '*', element: <Suspense fallback={<LoadingPage />}><NotFoundPage /></Suspense> },
    ],
  },
]);


