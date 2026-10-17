import { useTablePreferences } from '../lib/tablePreferences';
import React, { useEffect, useMemo, useRef, useState } from 'react';

// Render only the visible rows plus a small buffer, preserving native controls.
export default function VirtualDataTable({ columns, rows, selectedIds = [], onSelectedIdsChange, onOpen, onSort, renderCell, keyField = 'id', rowHeight: overrideRowHeight, formatCell = (column, row) => String(row[column.id] ?? '—') }) {
  const { rowHeight: defaultRowHeight } = useTablePreferences();
  const rowHeight = overrideRowHeight ?? defaultRowHeight;
  const viewport = useRef(null);
  const selectable = typeof onSelectedIdsChange === 'function';
  const rowKey = row => row[keyField];
  const [scrollTop, setScrollTop] = useState(0);
  const [height, setHeight] = useState(400);
  const [widths, setWidths] = useState({});
  const dragCleanup = useRef(null);
  useEffect(() => {
    const element = viewport.current;
    const observer = new ResizeObserver(() => setHeight(element.clientHeight));
    observer.observe(element);
    return () => { observer.disconnect(); dragCleanup.current?.(); };
  }, []);
  useEffect(() => { viewport.current.scrollTop = 0; setScrollTop(0); }, [rows, rowHeight]);
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const start = Math.max(0, Math.floor(Math.max(0, scrollTop - 36) / rowHeight) - 5);
  const end = Math.min(rows.length, start + Math.ceil(height / rowHeight) + 12);
  const sizes = columns.map(column => widths[column.id] || parseInt(column.width, 10) || 140);
  const template = `${selectable ? '36px ' : ''}${sizes.map((size, index) => columns[index].id === 'content' || columns[index].id === 'name' ? `minmax(${size}px, 1fr)` : `${size}px`).join(' ')}`;
  const gridStyle = { display: 'grid', gridTemplateColumns: template, minWidth: sizes.reduce((sum, size) => sum + size, selectable ? 36 : 0) };
  const toggle = id => onSelectedIdsChange?.(selected.has(id) ? selectedIds.filter(value => value !== id) : [...selectedIds, id]);
  const openRow = (event, row) => {
    if (!onOpen || event.defaultPrevented || window.getSelection()?.toString()) return;
    if (event.target.closest('button, a, input, select, textarea, label, [role="button"], [role="checkbox"], [data-row-control], [contenteditable="true"]')) return;
    onOpen(row);
  };
  const resize = (event, column, index) => {
    event.preventDefault(); event.stopPropagation();
    dragCleanup.current?.();
    const initialX = event.clientX;
    const move = next => setWidths(previous => ({ ...previous, [column.id]: Math.max(80, sizes[index] + next.clientX - initialX) }));
    const stop = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', stop); window.removeEventListener('pointercancel', stop); };
    dragCleanup.current = stop;
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', stop); window.addEventListener('pointercancel', stop);
  };

  return (
    <div ref={viewport} className="h-full w-full overflow-auto bg-white dark:bg-slate-950 text-xs select-text" onScroll={event => setScrollTop(event.currentTarget.scrollTop)} role="table" aria-rowcount={rows.length + 1}>
      <div role="row" style={gridStyle} className="sticky top-0 z-10 h-9 items-center border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-semibold">
        {selectable && <div role="columnheader" className="text-center"><input aria-label="Chọn tất cả dòng" type="checkbox" checked={rows.length > 0 && rows.every(row => selected.has(rowKey(row)))} onChange={event => onSelectedIdsChange?.(event.target.checked ? [...new Set([...selectedIds, ...rows.map(rowKey)])] : selectedIds.filter(id => !rows.some(row => rowKey(row) === id)))} /></div>}
        {columns.map((column, index) => <div key={column.id} role="columnheader" className="relative h-full flex items-center px-3">
          <button type="button" className="truncate text-left" onClick={() => onSort?.(column.id)}>{column.label}</button>
          <div role="separator" aria-orientation="vertical" aria-label={`Đổi độ rộng ${column.label}`} onPointerDown={event => resize(event, column, index)} className="absolute right-0 top-0 h-full w-2 cursor-col-resize touch-none hover:bg-emerald-200 dark:hover:bg-emerald-800" />
        </div>)}
      </div>
      <div style={{ height: rows.length * rowHeight, position: 'relative', minWidth: gridStyle.minWidth }}>
        {rows.slice(start, end).map((row, offset) => <div key={rowKey(row)} role="row" aria-rowindex={start + offset + 2} tabIndex={onOpen ? 0 : undefined} onClick={event => openRow(event, row)} onKeyDown={event => { if (onOpen && event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onOpen(row); } }} style={{ ...gridStyle, position: 'absolute', top: (start + offset) * rowHeight, height: rowHeight, width: '100%' }} className={`items-center border-b border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-200 ${onOpen ? 'cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 focus-visible:-outline-offset-2' : ''} ${selected.has(rowKey(row)) ? 'bg-emerald-50 dark:bg-emerald-950' : 'hover:bg-slate-50 dark:hover:bg-slate-900'}`}>
          {selectable && <div role="cell" data-row-control className="text-center"><input type="checkbox" aria-label={`Chọn ${rowKey(row)}`} checked={selected.has(rowKey(row))} onChange={() => toggle(rowKey(row))} /></div>}
          {columns.map(column => <div key={column.id} role="cell" className="min-w-0 px-3">
            {renderCell ? renderCell(column, row, start + offset) : column.id === 'actions' ? <button type="button" onClick={() => onOpen?.(row)} className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline">{row.name ? 'Mở thư mục' : 'Xem'}</button> : <div title={formatCell(column, row)} className={`block w-full text-left select-text ${onOpen ? 'cursor-pointer' : 'cursor-text'} ${column.id === 'isCritical' && row.isCritical ? 'text-rose-600' : ''}`}><span className="line-clamp-2 break-words leading-5">{formatCell(column, row)}</span></div>}
          </div>)}
        </div>)}
      </div>
    </div>
  );
}
