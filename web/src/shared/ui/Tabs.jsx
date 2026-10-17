import React from 'react';

export default function Tabs({ tabs = [], activeTab, onChange, className = '' }) {
  return <div role="tablist" className={`ui-tabs flex items-center gap-5 overflow-x-auto ${className}`}>
    {tabs.map(tab => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => onChange(tab.id)} className={`inline-flex shrink-0 items-center gap-2 border-b-2 py-2.5 text-xs font-medium whitespace-nowrap ${activeTab === tab.id ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>
      {tab.icon && <tab.icon size={16} />}<span>{tab.label}</span>
      {tab.count != null && <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px]">{tab.count}</span>}
    </button>)}
  </div>;
}
