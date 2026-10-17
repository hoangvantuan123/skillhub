import SearchInput from './SearchInput';
import { filterSelectOptions } from '../lib/searchOptions';
import React, { useState, useEffect, useRef } from 'react';
import { ListFilter } from 'lucide-react';

export default function FilterToggleMenu({ columns, filters, onToggle }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const matchingColumns = filterSelectOptions(columns.map(column => ({ ...column, value: column.id })), query);
  const container = useRef(null);
  const trigger = useRef(null);
  useEffect(() => {
    if (!open) { setQuery(''); return; }
    const outside = event => { if (!container.current?.contains(event.target)) setOpen(false); };
    const escape = event => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  return <div ref={container} className="relative shrink-0">
    <button ref={trigger} type="button" title="Bật/tắt bộ lọc" aria-label="Bật/tắt bộ lọc" aria-expanded={open} onClick={() => setOpen(value => !value)} className={`h-8 w-8 flex items-center justify-center rounded-lg border transition-colors ${open ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-emerald-500'}`}><ListFilter size={16} /></button>
    {open && <div role="group" aria-label="Các trường lọc" className="absolute top-full right-0 sm:left-0 sm:right-auto mt-1.5 z-50 w-60 max-w-[calc(100vw-2rem)] max-h-72 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5">
      <div className="sticky top-0 bg-white dark:bg-slate-900 pb-1.5"><SearchInput size="sm" aria-label="Tìm trường lọc" placeholder="Tìm trường lọc…" value={query} onChange={event => setQuery(event.target.value)} autoFocus /></div>
      {!matchingColumns.length && <p role="status" className="p-3 text-xs text-slate-500">Không tìm thấy trường lọc.</p>}
      {matchingColumns.map(column => <label key={column.id} className="flex items-center gap-2 rounded px-2.5 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
        <input type="checkbox" checked={Object.hasOwn(filters, column.id)} onChange={() => onToggle(column.id)} className="accent-emerald-600" />
        {column.label}
      </label>)}
    </div>}
  </div>;
}

