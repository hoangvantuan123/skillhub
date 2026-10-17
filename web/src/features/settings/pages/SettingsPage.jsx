import PersonalProfile from './PersonalProfile';
import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import TableDisplaySettings from './TableDisplaySettings';
import ManagementFrame from '../../../shared/ui/ManagementFrame';
import VirtualDataTable from '../../../shared/ui/VirtualDataTable';
import Input from '../../../shared/ui/Input';
import Button from '../../../shared/ui/Button';
import Tabs from '../../../shared/ui/Tabs';
import SearchInput from '../../../shared/ui/SearchInput';
import Select from '../../../shared/ui/Select';
import FilterToggleMenu from '../../../shared/ui/FilterToggleMenu';
import Modal from '../../../shared/ui/Modal';
import { useAuth } from '../../../shared/hooks/useAuth';
import { authService } from '../../../services/auth/auth.service';
import { useTablePreferences } from '../../../shared/lib/tablePreferences';

const tabs = [{ id: 'profile', label: 'Hồ sơ cá nhân' }, { id: 'display', label: 'Hiển thị & Múi giờ' }, { id: 'activity', label: 'Nhật ký hoạt động của tôi' }];
const columns = [{ id: 'created_at', label: 'Thời gian', width: 190 }, { id: 'action', label: 'Hoạt động', width: 150 }, { id: 'success', label: 'Kết quả', width: 160 }, { id: 'ip', label: 'Địa chỉ IP', width: 160 }, { id: 'user_agent', label: 'Trình duyệt / Thiết bị', width: 380 }];
const normalize = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLocaleLowerCase('vi').trim();
export default function SettingsPage() {
  const { currentUser } = useAuth();
  return <PersonalSettings key={currentUser.id || currentUser.user_id || currentUser.username} currentUser={currentUser} />;
}
function PersonalSettings({ currentUser }) {
  const [tab, setTab] = useState('profile');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState({ field: 'created_at', asc: false });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [detail, setDetail] = useState(null);
  const preferences = useTablePreferences();
  const formatCell = (column, row) => column.id === 'created_at' ? new Date(row.created_at).toLocaleString('vi-VN', { timeZone: preferences.timezone || 'Asia/Ho_Chi_Minh' }) : column.id === 'success' ? (row.success ? 'Thành công' : 'Không thành công') : String(row[column.id] || '—');
  useEffect(() => {
    if (tab !== 'activity') return;
    let active = true; setLoading(true); setError('');
    authService.history().then(result => { if (active) setHistory((result.history || []).map((event, index) => ({ ...event, id: event.id || event.created_at + '-' + index, action: 'Đăng nhập' }))); })
      .catch(() => { if (active) { setHistory([]); setError('Không tải được nhật ký cá nhân. Vui lòng thử làm mới.'); } }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [tab, reload]);
  const filtered = useMemo(() => history.filter(row => columns.some(column => normalize(formatCell(column, row)).includes(normalize(search))) && Object.entries(filters).every(([key, value]) => !value || (key === 'success' ? String(row.success) === value : normalize(formatCell({ id: key }, row)).includes(normalize(value))))).sort((a, b) => {
    const result = sort.field === 'created_at' ? new Date(a.created_at) - new Date(b.created_at) : formatCell({ id: sort.field }, a).localeCompare(formatCell({ id: sort.field }, b), 'vi');
    return result * (sort.asc ? 1 : -1);
  }), [history, search, filters, sort, preferences.timezone]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const rows = useMemo(() => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filtered, currentPage, pageSize]);
  const toggle = key => { setPage(1); setFilters(previous => { const next = { ...previous }; if (Object.hasOwn(next, key)) delete next[key]; else next[key] = ''; return next; }); };
  const activity = tab === 'activity';
  return <>
    <ManagementFrame
      header={<><div className="management-tabs"><Tabs tabs={tabs} activeTab={tab} onChange={setTab} /></div><div className="management-actions">{activity && <Button size="sm" variant="outline" icon={RefreshCw} disabled={loading} onClick={() => setReload(value => value + 1)}>Làm mới</Button>}</div></>}
      filters={activity && <><SearchInput size="sm" className="sm:max-w-72" placeholder="Tìm hoạt động, IP, thiết bị…" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} />{Object.entries(filters).map(([key, value]) => key === 'success' ? <Select key={key} size="sm" className="w-44" value={value} onChange={event => { setFilters(previous => ({ ...previous, [key]: event.target.value })); setPage(1); }} options={[{ value: '', label: 'Tất cả kết quả' }, { value: 'true', label: 'Thành công' }, { value: 'false', label: 'Không thành công' }]} /> : <SearchInput key={key} size="sm" className="sm:max-w-48" aria-label={columns.find(column => column.id === key).label} placeholder={columns.find(column => column.id === key).label} value={value} onChange={event => { setFilters(previous => ({ ...previous, [key]: event.target.value })); setPage(1); }} />)}<FilterToggleMenu columns={columns} filters={filters} onToggle={toggle} /></>}
      status={<><span>Cài đặt cá nhân · {activity ? 'Nhật ký đăng nhập của tôi (50 lần gần nhất) · ' + filtered.length + '/' + history.length + ' bản ghi' : tabs.find(item => item.id === tab).label}</span>{activity && <div className="flex items-center gap-2"><Select size="sm" className="w-28" aria-label="Số dòng mỗi trang" value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }} options={[25, 50, 100].map(value => ({ value, label: value + ' dòng' }))} /><Button size="sm" variant="ghost" icon={ChevronLeft} aria-label="Trang trước" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} /><span>{currentPage} / {pages}</span><Button size="sm" variant="ghost" icon={ChevronRight} aria-label="Trang sau" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)} /></div>}</>}
    >
      {activity ? loading ? <p role="status" className="p-4 text-sm text-slate-500">Đang tải nhật ký của bạn…</p> : error ? <p role="alert" className="p-4 text-sm text-rose-600">{error}</p> : <><VirtualDataTable columns={columns} rows={rows} formatCell={formatCell} onOpen={setDetail} onSort={field => setSort(previous => ({ field, asc: previous.field === field ? !previous.asc : true }))} />{!rows.length && <p role="status" className="p-3 text-xs text-slate-500">{history.length ? 'Không có hoạt động phù hợp.' : 'Chưa có lịch sử đăng nhập.'}</p>}</> : <div className="flex-1 min-h-0 overflow-auto p-4 md:p-6">
        {tab === 'display' ? <TableDisplaySettings /> : <PersonalProfile />}
      </div>}
    </ManagementFrame>
    <Modal open={!!detail} onClose={() => setDetail(null)} title="Chi tiết hoạt động của tôi" size="lg" density="compact" footer={<Button size="sm" variant="outline" onClick={() => setDetail(null)}>Đóng</Button>}>
      {detail && <dl className="space-y-4 text-sm">{columns.map(column => <div key={column.id}><dt className="font-semibold mb-1">{column.label}</dt><dd className="break-words whitespace-pre-wrap">{formatCell(column, detail)}</dd></div>)}</dl>}
    </Modal>
  </>;
}
