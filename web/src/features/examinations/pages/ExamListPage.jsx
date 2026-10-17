import ManagementFrame from '../../../shared/ui/ManagementFrame';
import VirtualDataTable from '../../../shared/ui/VirtualDataTable';
import TableFilters from '../../../shared/ui/TableFilters';
import Tabs from '../../../shared/ui/Tabs';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';


import Button from '../../../shared/ui/Button';
import Badge from '../../../shared/ui/Badge';
import { mockApi } from '../../../mocks/mockService';
import { formatDate } from '../../../shared/lib/formatters';
import { Calendar, Clock, ArrowRight, ShieldCheck, LayoutGrid, List, MapPin, Sliders, ChevronLeft, ChevronRight } from 'lucide-react';

const TABLE_COLUMNS = [
  {
    "id": "code",
    "label": "Mã ca thi",
    "width": 150
  },
  {
    "id": "title",
    "label": "Tên kỳ thi",
    "width": 350
  },
  {
    "id": "description",
    "label": "Mô tả",
    "width": 300
  },
  {
    "id": "durationMinutes",
    "label": "Thời lượng",
    "width": 100
  },
  {
    "id": "startTime",
    "label": "Mở ca",
    "width": 160
  },
  {
    "id": "location",
    "label": "Vị trí",
    "width": 190
  },
  {
    "id": "status",
    "label": "Trạng thái",
    "width": 130
  },
  {
    "id": "actions",
    "label": "Thao tác",
    "width": 90
  }
];

export default function ExamListPage() {
  const navigate = useNavigate();
  const [fieldFilters, setFieldFilters] = useState({ status: '', location: '' });
  const formatField = (column, row) => {
    if (column.id === 'startTime') return formatDate(row.startTime);
    if (column.id === 'status') return row.statusLabel || ({published:'Đã xuất bản',draft:'Bản nháp',scheduled:'Sắp diễn ra',in_progress:'Đang mở ca',completed:'Đã hoàn tất'})[row.status] || row.status || '—';
    if (column.id === 'examType') return row.examType === 'official_exam' ? 'Sát hạch' : 'Luyện tập';
    if (column.id === 'durationMinutes') return (row.durationMinutes || 45) + ' phút';
    if (column.id === 'questionCount') return String(row.questionCount || row.questions?.length || 40);
    if (column.id === 'actions') return 'Xem';
    return String(row[column.id] ?? '—');
  };

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  // View Mode: 'cards' | 'table' (Support both!)
  const [viewMode, setViewMode] = useState('table');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState({ field: 'code', ascending: true });
  const [pageSize, setPageSize] = useState(12);

  useEffect(() => {
    mockApi.getExams().then((res) => {
      const list = (res.data || []).map((e, idx) => ({
        ...e,
        location: idx % 2 === 0 ? 'Xưởng In Offset — Trạm HMI 01' : 'Xưởng SMT — Dây chuyền 04',
      }));
      setExams(list);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    return exams.filter(row => Object.entries(fieldFilters).every(([key, query]) => !query || formatField({id:key}, row).toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')))).filter((e) => {
      const matchSearch =
        !search ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.code.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !selectedStatus || e.status === selectedStatus;
      const matchLocation = !selectedLocation || e.location === selectedLocation;
      return matchSearch && matchStatus && matchLocation;
    });
  }, [exams, search, selectedStatus, selectedLocation, fieldFilters]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const currentPageSafe = Math.min(currentPage, totalPages);
  const pagedExams = useMemo(() => {
    const start = (currentPageSafe - 1) * pageSize;
    const sorted = [...filtered].sort((a, b) => {
      const av = a[sort.field]; const bv = b[sort.field];
      const compare = typeof av === 'number' && typeof bv === 'number' ? av - bv : formatField({id:sort.field}, a).localeCompare(formatField({id:sort.field}, b), 'vi', {numeric:true});
      return sort.ascending ? compare : -compare;
    });
    return sorted.slice(start, start + pageSize);
  }, [filtered, currentPageSafe, pageSize, sort]);

  return (
    <ManagementFrame className="management-screen" header={<><Tabs tabs={[{id:'table',label:'Danh sách',icon:List},{id:'cards',label:'Dạng thẻ',icon:LayoutGrid}]} activeTab={viewMode} onChange={setViewMode} /><div className="management-actions"><div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Sliders}
              onClick={() => navigate('/manage/blueprints')}
              className="!h-8 !text-xs whitespace-nowrap"
            >
              Cấu hình đề thi & luyện
            </Button>
          </div></div></>} filters={<TableFilters fields={TABLE_COLUMNS} data={exams} filters={fieldFilters} onChange={next => { setFieldFilters(next); setCurrentPage(1); }} search={search} onSearchChange={value => { setSearch(value); setCurrentPage(1); }} formatCell={formatField} />} status={<div className="contents">
        <div className="flex flex-wrap items-center gap-2"><strong>Ca thi & Kỳ thi</strong><div>
          Hiển thị <strong className="text-slate-900 dark:text-white">{pagedExams.length}</strong> trong <strong className="text-slate-900 dark:text-white">{filtered.length}</strong> ca thi
        </div></div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            icon={ChevronLeft}
            disabled={currentPageSafe <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="!h-8 !w-8 !p-0"
          />
          <span className="px-2 font-semibold">
            {currentPageSafe} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            icon={ChevronRight}
            disabled={currentPageSafe >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="!h-8 !w-8 !p-0"
          />
        </div>
      </div>}>
<div className="flex-1 min-h-0 w-full relative overflow-hidden bg-white dark:bg-slate-950 flex flex-col">
        {/* VIEW 1: CARDS */}
        {viewMode === 'cards' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {pagedExams.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-xs">
                Không tìm thấy ca thi nào phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pagedExams.map((exam) => (
                  <div
                    key={exam.id}
                    className="rounded-md border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700  transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <Badge variant="success" size="sm">{exam.statusLabel || 'Đang mở'}</Badge>
                        <span className="font-mono text-[11px] font-bold text-slate-400">
                          {exam.code}
                        </span>
                      </div>

                      <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 mb-2">
                        {exam.title}
                      </h2>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                        {exam.description}
                      </p>

                      {/* Detail Metrics */}
                      <div className="flex flex-col gap-1.5 p-3 rounded-md bg-slate-50/70 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 text-xs mb-3">
                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Clock size={12} /> Thời lượng:
                          </span>
                          <strong className="text-slate-900 dark:text-white">{exam.durationMinutes} phút</strong>
                        </div>
                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Calendar size={12} /> Thời gian mở:
                          </span>
                          <span>{formatDate(exam.startTime)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                          <span className="text-slate-400 flex items-center gap-1">
                            <ShieldCheck size={12} /> Hạn nộp cứng:
                          </span>
                          <strong className="text-rose-600 dark:text-rose-400">{formatDate(exam.hardDeadline)}</strong>
                        </div>
                        <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                          <span className="text-slate-400 flex items-center gap-1">
                            <MapPin size={12} /> Vị trí thi:
                          </span>
                          <span className="truncate">{exam.location || 'Xưởng sản xuất'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400 font-medium">
                        Tối đa: <strong>{exam.maxAttempts || 1} lượt thi</strong>
                      </span>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={ArrowRight}
                        iconPosition="right"
                        onClick={() => navigate(`/app/exams/${exam.id}`)}
                        className="!text-xs"
                      >
                        Vào ca thi
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: TABLE */}
        {viewMode === 'table' && <VirtualDataTable columns={TABLE_COLUMNS} rows={pagedExams} formatCell={formatField} onSort={field => { if (field !== 'actions') setSort(previous => ({field, ascending: previous.field === field ? !previous.ascending : true})); }} onOpen={row => navigate('/app/exams/' + row.id)}  />}
      </div>

</ManagementFrame>
  );
}
