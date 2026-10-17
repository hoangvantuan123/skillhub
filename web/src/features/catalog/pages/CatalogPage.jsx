import React, { useMemo, useState } from 'react';
import { Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import AttributeCatalogModal from '../components/AttributeCatalogModal';
import { businessCatalogs } from '../services/attributeCatalog';
import useAttributeCatalog from '../../../shared/hooks/useAttributeCatalog';
import ManagementFrame from '../../../shared/ui/ManagementFrame';
import VirtualDataTable from '../../../shared/ui/VirtualDataTable';
import Button from '../../../shared/ui/Button';
import Tabs from '../../../shared/ui/Tabs';
import SearchInput from '../../../shared/ui/SearchInput';
import Select from '../../../shared/ui/Select';
import Input from '../../../shared/ui/Input';
import FilterToggleMenu from '../../../shared/ui/FilterToggleMenu';

const columns = [
  { id: 'value', label: 'Mã', width: 160 },
  { id: 'name', label: 'Tên hiển thị', width: 360 },
  { id: 'active', label: 'Trạng thái', width: 180 },
];
const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLocaleLowerCase('vi').trim();
const formatCell = (column, row) => column.id === 'active' ? (row.active ? 'Đang sử dụng' : 'Ngừng sử dụng') : row[column.id] || '—';

function CatalogTable({ catalogKey, onTabChange }) {
  const catalog = useAttributeCatalog(catalogKey);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState({ field: 'value', asc: true });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selection, setSelection] = useState([]);
  const filtered = useMemo(() => catalog.options.map(option => ({ ...option, name: option.label })).filter(row =>
    columns.some(column => normalize(formatCell(column, row)).includes(normalize(search))) &&
    Object.entries(filters).every(([key, query]) => !query || (key === 'active' ? String(row.active) === query : normalize(formatCell({ id: key }, row)).includes(normalize(query))))
  ).sort((a, b) => formatCell({ id: sort.field }, a).localeCompare(formatCell({ id: sort.field }, b), 'vi', { numeric: true }) * (sort.asc ? 1 : -1)), [catalog.options, search, filters, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const rows = useMemo(() => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filtered, currentPage, pageSize]);
  const toggleFilter = key => { setPage(1); setFilters(previous => { const next = { ...previous }; if (Object.hasOwn(next, key)) delete next[key]; else next[key] = ''; return next; }); };
  return <>
    <ManagementFrame
      header={<><div className="management-tabs"><Tabs tabs={businessCatalogs.map(item => ({ id: item.key, label: item.label }))} activeTab={catalogKey} onChange={onTabChange} /></div><div className="management-actions"><Button size="sm" icon={Settings} onClick={() => setOpen(true)}>Đăng ký / Chỉnh sửa</Button></div></>}
      filters={<>
        <SearchInput size="sm" className="sm:max-w-72" value={search} placeholder="Tìm mã, tên danh mục…" onChange={event => { setSearch(event.target.value); setPage(1); }} />
        {Object.entries(filters).map(([key, value]) => key === 'active'
          ? <Select key={key} size="sm" className="w-44" value={value} onChange={event => { setFilters(previous => ({ ...previous, [key]: event.target.value })); setPage(1); }} options={[{ value: '', label: 'Tất cả trạng thái' }, { value: 'true', label: 'Đang sử dụng' }, { value: 'false', label: 'Ngừng sử dụng' }]} />
          : <Input key={key} size="sm" className="w-44" aria-label={columns.find(column => column.id === key).label} placeholder={columns.find(column => column.id === key).label} value={value} onChange={event => { setFilters(previous => ({ ...previous, [key]: event.target.value })); setPage(1); }} />)}
        <FilterToggleMenu columns={columns} filters={filters} onToggle={toggleFilter} />
      </>}
      status={<><span>Danh mục hệ thống · {catalog.label} · {filtered.length}/{catalog.options.length} bản ghi · Đã chọn: {selection.length}</span><div className="flex flex-wrap items-center gap-2"><Select size="sm" className="w-28" aria-label="Số dòng mỗi trang" value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }} options={[25, 50, 100].map(value => ({ value, label: value + ' dòng' }))} /><Button size="sm" variant="ghost" icon={ChevronLeft} aria-label="Trang trước" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} /><span>{currentPage} / {pages}</span><Button size="sm" variant="ghost" icon={ChevronRight} aria-label="Trang sau" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)} /></div></>}
    >
      {catalog.error ? <p role="alert" className="p-4 text-sm text-rose-600">{catalog.error}</p> : catalog.loading ? <p role="status" className="p-4 text-sm">Đang tải danh mục…</p> : <>
        <VirtualDataTable columns={columns} rows={rows} keyField="value" formatCell={formatCell} selectedIds={selection} onSelectedIdsChange={setSelection} onSort={field => setSort(previous => ({ field, asc: previous.field === field ? !previous.asc : true }))} />
        {!filtered.length && <p role="status" className="p-3 text-xs text-slate-500">Không có danh mục phù hợp.</p>}
      </>}
    </ManagementFrame>
    <AttributeCatalogModal open={open} onClose={() => setOpen(false)} attributeKey={catalogKey} />
  </>;
}

export default function CatalogPage() {
  const [catalogKey, setCatalogKey] = useState('position');
  return <CatalogTable key={catalogKey} catalogKey={catalogKey} onTabChange={setCatalogKey} />;
}
