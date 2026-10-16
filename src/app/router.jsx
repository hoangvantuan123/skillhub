import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import WorkspaceLayout from '../layouts/WorkspaceLayout';
import AuthLayout from '../layouts/AuthLayout';
import ExamLayout from '../layouts/ExamLayout';

// Features
import { LoginPage, AccessDeniedPage } from '../features/auth';
import { DashboardPage } from '../features/dashboard';
import { QuestionListPage, QuestionEditorPage } from '../features/questions';
import { AssessmentListPage, AssessmentEditorPage, ExamBlueprintConfigPage } from '../features/assessments';
import { ExamListPage, ExamDetailPage, CandidateExamLoginPage } from '../features/examinations';
import { ExamLobbyPage, AttemptPage, SubmissionReceiptPage } from '../features/attempts';
import { PracticeSetupPage, PracticePlayerPage } from '../features/practice';
import { GradingQueuePage, GradingDetailPage } from '../features/grading';
import { CourseListPage, LessonPage } from '../features/learning';
import { KnowledgePage } from '../features/knowledge';
import { ReportsPage } from '../features/reports';
import { GroupsPage, UserManagementPage } from '../features/organization';
import { CatalogPage } from '../features/catalog';
import { SettingsPage } from '../features/settings';
import { NotificationsPage } from '../features/notifications';

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
      { path: '/login', element: <LoginPage /> },
      { path: '/access-denied', element: <AccessDeniedPage /> },
      { path: '/exam-entry', element: <CandidateExamLoginPage /> },
      { path: '/exam/login', element: <CandidateExamLoginPage /> },
    ],
  },

  // Focused Exam Taking Layout (Distraction-free)
  {
    element: <ExamLayout />,
    children: [
      { path: '/exam/attempts/:attemptId', element: <AttemptPage /> },
    ],
  },

  // Main Workspace Layout
  {
    element: <WorkspaceLayout />,
    children: [
      { path: '/app', element: <DashboardPage /> },

      // Learning & Courses
      { path: '/app/learning', element: <CourseListPage /> },
      { path: '/app/learning/:courseId/lessons/:lessonId', element: <LessonPage /> },

      // Knowledge Base
      { path: '/app/knowledge', element: <KnowledgePage /> },

      // Practice
      { path: '/app/practice', element: <PracticeSetupPage /> },
      { path: '/app/practice/player', element: <PracticePlayerPage /> },

      // Candidate Exams
      { path: '/app/exams', element: <ExamListPage /> },
      { path: '/app/exams/:examId', element: <ExamDetailPage /> },
      { path: '/app/exams/:examId/lobby', element: <ExamLobbyPage /> },

      // Results & Receipts
      { path: '/app/results/:attemptId', element: <SubmissionReceiptPage /> },

      // Questions Management
      { path: '/manage/questions', element: <QuestionListPage /> },
      { path: '/manage/questions/new', element: <QuestionEditorPage /> },
      { path: '/manage/questions/:id/edit', element: <QuestionEditorPage /> },

      // Assessments Management
      { path: '/manage/assessments', element: <AssessmentListPage /> },
      { path: '/manage/assessments/new', element: <AssessmentEditorPage /> },
      { path: '/manage/assessments/:id', element: <AssessmentEditorPage /> },
      { path: '/manage/blueprints', element: <ExamBlueprintConfigPage /> },
      { path: '/manage/assessments/settings', element: <ExamBlueprintConfigPage /> },

      // Exam Management
      { path: '/manage/exams', element: <ExamListPage /> },

      // Grading Management
      { path: '/manage/grading', element: <GradingQueuePage /> },
      { path: '/manage/grading/:submissionId', element: <GradingDetailPage /> },

      // Groups & Organization & Users
      { path: '/manage/groups', element: <GroupsPage /> },
      { path: '/admin/users', element: <UserManagementPage /> },

      // Reports
      { path: '/manage/reports', element: <ReportsPage /> },

      // Admin & Catalog
      { path: '/admin/catalog', element: <CatalogPage /> },
      { path: '/admin/settings', element: <SettingsPage /> },

      // Notifications Center
      { path: '/notifications', element: <NotificationsPage /> },

      // 404 Fallback inside Workspace
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
