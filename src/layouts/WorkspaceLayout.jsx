import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import HelpDialog from '../shared/components/HelpDialog';
import { Menu, CircleHelp } from 'lucide-react';
import { useAuth } from '../shared/hooks/useAuth';

export default function WorkspaceLayout() {
  const { currentUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Mở menu"
            >
              <Menu size={20} />
            </button>
            <img src="/assets/goldsun/goldsun-icon.png" alt="Goldsun" className="w-5 h-5 object-contain" />
            <span className="font-bold text-emerald-800 dark:text-emerald-400 text-sm tracking-wide">Đánh giá năng lực MES</span>
          </div>
          <button
            onClick={() => setHelpOpen(true)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400"
            title="Trợ giúp"
          >
            <CircleHelp size={18} />
          </button>
        </div>

        <div className="content-scroll workstation-no-scroll">
          <main id="main" className="content workstation-content">
            <Outlet />
          </main>


        </div>
      </div>

      {/* Global Help Dialog */}
      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
