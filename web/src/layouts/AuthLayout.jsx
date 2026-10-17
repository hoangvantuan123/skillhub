import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { ClipboardCheck, BookOpen, BarChart3 } from 'lucide-react';

export default function AuthLayout() {
  const viewportRef = useRef(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    // Safari's dynamic viewport does not always shrink with the keyboard.
    const updateHeight = () => {
      if (viewport.scale !== 1) return; // Preserve native pinch zoom.
      viewportRef.current?.style.setProperty('--auth-viewport-height', `${viewport.height}px`);
    };
    updateHeight();
    viewport.addEventListener('resize', updateHeight);
    window.addEventListener('resize', updateHeight);
    return () => {
      viewport.removeEventListener('resize', updateHeight);
      window.removeEventListener('resize', updateHeight);
    };
  }, []);
  const [theme] = useState(() => localStorage.getItem('skillhub_theme') || 'light');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('skillhub_theme', theme);
  }, [theme]);
  return (
    <div ref={viewportRef} className="auth-viewport overflow-y-auto flex flex-col bg-white lg:bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">

      <main className="mx-auto grid w-full max-w-6xl flex-1 shrink-0 items-start lg:items-center gap-6 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-2 lg:gap-20 lg:py-16">
        <section className="hidden lg:block">
          <img src="/assets/goldsun/goldsun-logo-col.png" alt="Goldsun Packaging" className="mb-6 h-auto w-24 object-contain" />
          <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Phát triển năng lực đội ngũ</p>
          <h1 className="max-w-lg text-4xl font-semibold leading-tight tracking-tight">Vững chuyên môn.<br /><span className="text-emerald-700 dark:text-emerald-400">Sẵn sàng tiến bước.</span></h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-slate-600 dark:text-slate-400">Không gian học tập và đánh giá dành cho đội ngũ Goldsun Packaging. Theo dõi năng lực, hoàn thành kỳ thi và phát triển chuyên môn tại một nơi.</p>
          <div className="mt-9 space-y-5 border-t border-slate-200 pt-7 dark:border-slate-800">
            {[[BookOpen, 'Học tập tập trung', 'Tiếp cận tài liệu và kiến thức chuyên môn.'], [ClipboardCheck, 'Đánh giá năng lực', 'Tham gia các kỳ thi theo kế hoạch.'], [BarChart3, 'Theo dõi tiến bộ', 'Xem kết quả và quá trình phát triển.']].map(([Icon, title, text]) => (
              <div key={title} className="flex items-start gap-3"><Icon size={19} className="mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-400" /><div><h2 className="text-sm font-semibold">{title}</h2><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{text}</p></div></div>
            ))}
          </div>
        </section>
        <div className="mx-auto w-full max-w-md">
          <Outlet />
        </div>
      </main>
      <footer className="mx-auto w-full max-w-6xl shrink-0 px-5 py-4 text-center text-[11px] sm:text-xs leading-5 text-slate-500 dark:text-slate-400 sm:px-8 sm:text-left">© 2026 Goldsun Packaging</footer>
    </div>
  );
}
