import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export default function ExamLayout() {
  return (
    <div className="exam-layout">
      {/* Focused Topbar & Outlet rendered inside AttemptPage or child */}
      <Outlet />
    </div>
  );
}
