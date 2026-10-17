import React from 'react';
export default function Textarea({ label, id, error, className = '', ...props }) {
  const fieldId = React.useId();
  return <div className="flex flex-col gap-1.5"><label htmlFor={id || fieldId} className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label><textarea id={id || fieldId} className={`w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 ${className}`} aria-invalid={!!error} {...props} />{error && <p className="text-xs text-red-600">{error}</p>}</div>;
}
