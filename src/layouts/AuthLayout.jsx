import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Sun, Moon, ShieldCheck, Factory } from 'lucide-react';
import { APP_CONFIG } from '../shared/config/constants';

export default function AuthLayout() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('skillhub_theme') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('skillhub_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-between p-4 sm:p-6 transition-colors duration-200">
      {/* Top Header Bar */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between py-2 px-1">
        <Link
          to="/app"
          className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md"
        >
          {/* Goldsun Logo Mark */}
          <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center p-1 shadow-xs group-hover:border-emerald-500 transition-colors">
            <img
              src="/assets/goldsun/goldsun-icon.png"
              alt="Goldsun Packaging"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-50 tracking-tight leading-tight">
              {APP_CONFIG.NAME}
            </div>
            <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 leading-tight">
              {APP_CONFIG.TAGLINE}
            </div>
          </div>
        </Link>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            type="button"
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            title={theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-md mx-auto my-auto py-6">
        <Outlet />
      </main>

      {/* Footer standard */}
      <footer className="w-full max-w-5xl mx-auto text-center py-4 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-medium">
          <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
          <span>© 2026 {APP_CONFIG.COMPANY} · Hệ thống Đánh giá Năng lực Kỹ thuật MES</span>
        </div>
        <div className="text-slate-400 dark:text-slate-500">
          Tiêu chuẩn cấu trúc ISA-95 & ISO 9001
        </div>
      </footer>
    </div>
  );
}
