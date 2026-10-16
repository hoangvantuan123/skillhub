import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Unified Full-Screen Portal Modal Component
 * Renders directly onto document.body to ensure 100% full-screen black backdrop coverage,
 * properly covering the entire viewport, sidebar, topbar, with zero layout clipping.
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth,
  width,
  size = 'lg', // 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  footer,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) onClose();
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
    '2xl': 'max-w-5xl',
  };

  const effectiveMaxWidth = maxWidth || width;

  const modalNode = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none">
      {/* Full-Screen Crystal-Clear Translucent Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 w-screen h-screen bg-black/20 dark:bg-black/60 backdrop-blur-[1px] transition-opacity cursor-pointer"
        aria-hidden="true"
      />

      {/* Centered Modal Dialog - Pure Bright Crisp White Background */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-[100000] w-full ${sizeClasses[size] || 'max-w-2xl'} max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden transform transition-all`}
        style={effectiveMaxWidth ? { maxWidth: effectiveMaxWidth } : undefined}
      >
        {/* Header - Pure Clean White */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body - Pure Bright White */}
        <div className="p-6 overflow-y-auto flex-1 select-text bg-white dark:bg-slate-900">
          {children}
        </div>

        {/* Footer (if provided) - Pure Clean White */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}
