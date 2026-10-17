import React, { useEffect, useId, useRef } from 'react';
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
  fitContent = false,
  density = 'compact', // compact for data, comfortable for forms
}) {
  const titleId = useId();
  const dialog = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => [...(dialog.current?.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]') || [])].filter(element => element.getClientRects().length);
    const frame = requestAnimationFrame(() => {
      const autoFocus = dialog.current?.querySelector('[autofocus]');
      (autoFocus || focusable()[0] || dialog.current)?.focus();
    });
    const handleKeyDown = event => {
      if (event.key === 'Escape') { event.preventDefault(); close.current?.(); }
      if (event.key === 'Tab') {
        const items = focusable();
        const first = items[0]; const last = items[items.length - 1];
        if (!first) { event.preventDefault(); dialog.current?.focus(); }
        else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);

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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-hidden select-text">
      {/* Full-Screen Crystal-Clear Translucent Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 w-screen h-screen bg-slate-950/30 dark:bg-black/60 transition-opacity cursor-pointer"
        aria-hidden="true"
      />

      {/* Centered Modal Dialog - Pure Bright Crisp White Background */}
      <div
        ref={dialog}
        tabIndex={-1}
        aria-labelledby={titleId}
        role="dialog"
        aria-modal="true"
        className={`ui-modal ${density === 'comfortable' ? 'ui-modal-comfortable' : ''} relative z-[100000] w-full ${sizeClasses[size] || 'max-w-2xl'} max-h-[calc(100dvh-2rem)] flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden`}
        style={{
          ...(density === 'comfortable' ? {
            width: '100%',
            maxWidth: size === 'xl' || size === '2xl' ? '960px' : '760px',
            height: fitContent ? 'auto' : 'min(680px, calc(100dvh - 32px))',
          } : {}),
          ...(effectiveMaxWidth ? { maxWidth: effectiveMaxWidth } : {}),
        }}
      >
        {/* Header - Pure Clean White */}
        <div className="flex items-center justify-between gap-3 px-4 min-h-11 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shrink-0">
          <h2 id={titleId} className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="shrink-0 p-1.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body - Pure Bright White */}
        <div className="ui-modal-body p-4 min-h-0 overflow-y-auto flex-1 text-xs select-text bg-white dark:bg-slate-900">
          {children}
        </div>

        {/* Footer (if provided) - Pure Clean White */}
        {footer && (
          <div className="flex items-center justify-end flex-wrap gap-2 px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}
