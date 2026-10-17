import React from 'react';
import { LoaderCircle } from 'lucide-react';

export default function LoadingPage({ message = 'Đang tải trang…', fullScreen = false }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={`${fullScreen ? 'fixed inset-0 z-[100] bg-white dark:bg-slate-950' : 'min-h-64 h-full w-full'} flex flex-col items-center justify-center gap-4 px-6 py-10 text-center text-slate-900 dark:text-slate-100`}>
      <img src="/assets/goldsun/goldsun-logo-col.png" alt="Goldsun Packaging" className="h-auto w-20 object-contain" />
      <LoaderCircle size={24} aria-hidden="true" className="animate-spin motion-reduce:animate-none text-emerald-600" />
      <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}
