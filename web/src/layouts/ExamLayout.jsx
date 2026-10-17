import { useAuth } from '../shared/hooks/useAuth';
import React from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';

export default function ExamLayout() {
  const { currentUser, authLoading } = useAuth();
  if (authLoading) return <div>Đang xác thực…</div>;
  if (!currentUser) return <Navigate to='/login' replace />;
  return (
    <div className="exam-layout">
      {/* Focused Topbar & Outlet rendered inside AttemptPage or child */}
      <Outlet />
    </div>
  );
}

