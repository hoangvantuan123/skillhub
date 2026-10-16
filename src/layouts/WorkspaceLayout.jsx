import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import HelpDialog from '../shared/components/HelpDialog';
import { Menu, CircleHelp, Info } from 'lucide-react';

export default function WorkspaceLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const location = useLocation();

  const isFullWorkstation = location.pathname === '/manage/questions';

  return (
    <div className="app-layout">
      {/* Sidebar navigation with integrated header controls */}
      <Sidebar
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onOpenHelp={() => setHelpOpen(true)}
      />

      {/* Main shell without topbar eating vertical space */}
      <div className="shell">
        {/* Mobile Header only (< 768px) */}
        <div className="md:hidden flex items-center justify-between px-4 h-12 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Mở menu"
            >
              <Menu size={20} />
            </button>
            <span className="font-bold text-emerald-800 dark:text-emerald-400 text-sm tracking-wide">SkillHub</span>
          </div>
          <button
            onClick={() => setHelpOpen(true)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400"
            title="Trợ giúp"
          >
            <CircleHelp size={18} />
          </button>
        </div>

        <div className={`content-scroll ${isFullWorkstation ? 'workstation-no-scroll' : ''}`}>
          <main id="main" className={`content animate-fade-in ${isFullWorkstation ? 'workstation-content' : ''}`}>
            <Outlet />
          </main>

          {!isFullWorkstation && (
            <footer className="app-footer">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  className="icon-button"
                  style={{ width: '30px', height: '30px' }}
                  aria-label="Thông tin hệ thống SkillHub"
                  onClick={() => setHelpOpen(true)}
                >
                  <Info size={17} />
                </button>
                <span>SkillHub © 2026 — Nền tảng Đánh giá & Học tập Năng lực</span>
              </div>
              <div>Múi giờ: Asia/Ho_Chi_Minh (UTC+7)</div>
            </footer>
          )}
        </div>
      </div>

      {/* Global Help Dialog */}
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
