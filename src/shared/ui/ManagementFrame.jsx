import React from 'react';

/** Standard management screen: tabs/actions, filters, scrolling table, status. */
export default function ManagementFrame({ children, header, filters, status, className = '' }) {
  return <div className={`flex flex-col h-full min-h-0 w-full overflow-hidden bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 select-text ${className}`}>
    {header && <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-2.5 border-b border-slate-200 dark:border-slate-800 shrink-0">{header}</div>}
    {filters && <div className="flex flex-wrap items-center gap-2 p-3 border-b border-slate-200 dark:border-slate-800 shrink-0">{filters}</div>}
    {header || filters || status ? <div className="flex flex-col flex-1 min-h-0 overflow-hidden">{children}</div> : children}
    {status && <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shrink-0">{status}</div>}
  </div>;
}
