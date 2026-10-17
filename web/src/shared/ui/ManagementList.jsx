import React, { useMemo, useState } from 'react';
import ManagementFrame from './ManagementFrame';
import VirtualDataTable from './VirtualDataTable';
import SearchInput from './SearchInput';
import FilterToggleMenu from './FilterToggleMenu';
import Select from './Select';
import Button from './Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const normalizeText = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLocaleLowerCase('vi').trim();
function renderedText(value) {
  if (value == null || typeof value === 'boolean') return '';
  if (Array.isArray(value)) return value.map(renderedText).join(' ');
  if (React.isValidElement(value)) return renderedText(value.props.children);
  return String(value);
}
export function cellText(column, row) {
  const key = column.id || column.key;
  if (column.filterValue) return String(column.filterValue(row) ?? '');
  const result = column.render ? renderedText(column.render(row[key], row, 0)) : '';
  return result || String(row[key] ?? '');
}

/** Complete reference list screen: tabs/actions → filters → virtual table → status. */
export default function ManagementList({ title, tabs, actions, columns, data = [], loading = false, onRowClick, keyField = 'id', searchPlaceholder = 'Tìm kiếm dữ liệu…', initialFilters = {} }) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sort, setSort] = useState({ key: '', ascending: true });
  const fields = useMemo(() => columns.map(column => ({ ...column, id: column.id || column.key, label: column.label || column.title, width: column.width || (['name', 'title', 'content', 'description', 'examTitle'].includes(column.key) ? 320 : 160) })), [columns]);
  const filterFields = fields.filter(column => !['actions', 'action', 'operations'].includes(column.id));
  const filtered = useMemo(() => {
    const query = normalizeText(search);
    const result = data.filter(row => (!query || filterFields.some(column => normalizeText(cellText(column, row)).includes(query))) && Object.entries(filters).every(([key, value]) => {
      const column = fields.find(field => field.id === key);
      return !value || !column || normalizeText(cellText(column, row)).includes(normalizeText(value));
    }));
    const column = fields.find(field => field.id === sort.key);
    if (column) result.sort((a, b) => {
      const av = a[column.id]; const bv = b[column.id];
      const compare = typeof av === 'number' && typeof bv === 'number' ? av - bv : cellText(column, a).localeCompare(cellText(column, b), 'vi', { numeric: true });
      return sort.ascending ? compare : -compare;
    });
    return result;
  }, [data, fields, search, filters, sort]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const update = (key, value) => { setFilters(previous => ({ ...previous, [key]: value })); setPage(1); };
  return <ManagementFrame className="management-screen"
    header={<><div className="management-tabs">{tabs || <span className="management-tab-active">Danh sách</span>}</div><div className="management-actions">{actions}</div></>}
    filters={<><div className="w-full sm:w-72"><SearchInput size="sm" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} onClear={() => { setSearch(''); setPage(1); }} placeholder={searchPlaceholder} /></div>
      {filterFields.filter(column => Object.hasOwn(filters, column.id)).map(column => {
        const values = [...new Set(data.map(row => cellText(column, row)))].filter(Boolean);
        const categorical = column.filterType === 'select' || (!['name', 'title', 'content', 'description', 'email', 'candidateName', 'examTitle'].includes(column.id) && values.length <= 40);
        return categorical ? <Select key={column.id} size="sm" className="w-full sm:w-52" placeholder={`Tất cả ${column.label}`} value={filters[column.id]} options={values.map(value => ({ value, label: value }))} onChange={event => update(column.id, event.target.value)} /> : <input key={column.id} aria-label={`Lọc ${column.label}`} placeholder={`Lọc ${column.label}…`} value={filters[column.id]} onChange={event => update(column.id, event.target.value)} className="h-8 w-full sm:w-52 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs" />;
      })}
      <FilterToggleMenu columns={filterFields} filters={filters} onToggle={key => { setFilters(previous => { const next = { ...previous }; if (Object.hasOwn(next, key)) delete next[key]; else next[key] = ''; return next; }); setPage(1); }} />
    </>}
    status={<><div className="flex flex-wrap gap-2"><strong>{title}</strong><span>· Tổng số: {filtered.length}{filtered.length !== data.length ? ` / ${data.length}` : ''}</span></div><div className="flex flex-wrap items-center gap-2"><span>Số dòng:</span><Select className="w-20" size="sm" placement="top" placeholder="" value={pageSize} options={[25, 50, 100, 200, 500]} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }} /><Button size="sm" variant="outline" icon={ChevronLeft} aria-label="Trang trước" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} /><span>{safePage} / {totalPages}</span><Button size="sm" variant="outline" icon={ChevronRight} aria-label="Trang sau" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} /></div></>}
  >
    {loading || !rows.length ? <p role="status" className="p-8 text-center text-sm text-slate-500">{loading ? 'Đang tải dữ liệu…' : 'Không có dữ liệu phù hợp.'}</p> : <VirtualDataTable columns={fields} rows={rows} keyField={keyField} onOpen={onRowClick} onSort={key => { if (!filterFields.some(field => field.id === key)) return; setSort(previous => ({ key, ascending: previous.key === key ? !previous.ascending : true })); }} formatCell={cellText}
      renderCell={(column, row, index) => <div className="max-h-12 overflow-hidden break-words" title={cellText(column, row)} onClick={event => { if (!event.target.closest('button, a, input, select') && !window.getSelection()?.toString()) onRowClick?.(row); }}>{column.render ? column.render(row[column.id], row, (safePage - 1) * pageSize + index) : cellText(column, row)}</div>} />}
  </ManagementFrame>;
}
