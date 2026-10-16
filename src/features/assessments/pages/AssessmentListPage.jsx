import ManagementFrame from '../../../shared/ui/ManagementFrame';
import VirtualDataTable from '../../../shared/ui/VirtualDataTable';
import TableFilters from '../../../shared/ui/TableFilters';
import Tabs from '../../../shared/ui/Tabs';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import Select from '../../../shared/ui/Select';
import Button from '../../../shared/ui/Button';
import Badge from '../../../shared/ui/Badge';

import { Plus, Clock, CheckCircle, FileText, LayoutGrid, List, Sliders, MapPin, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import { mockApi } from '../../../mocks/mockService';
import { formatDate } from '../../../shared/lib/formatters';
import { useToast } from '../../../shared/hooks/useToast';

const TABLE_COLUMNS = [
  {
    "id": "code",
    "label": "Mã bộ đề",
    "width": 150
  },
  {
    "id": "title",
    "label": "Tên bộ đề",
    "width": 350
  },
  {
    "id": "subjectName",
    "label": "Chuyên môn",
    "width": 180
  },
  {
    "id": "examType",
    "label": "Loại đề",
    "width": 130
  },
  {
    "id": "questionCount",
    "label": "Số câu",
    "width": 95
  },
  {
    "id": "durationMinutes",
    "label": "Thời lượng",
    "width": 100
  },
  {
    "id": "passingScore",
    "label": "Điểm đạt",
    "width": 100
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

export default function AssessmentListPage() {
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

  const { addToast } = useToast();

  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  // View Mode: 'table' | 'cards' (User requirement: support both!)
  const [viewMode, setViewMode] = useState('table');

  // Selection & Pagination
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortAsc, setSortAsc] = useState(false);
  const [sortField, setSortField] = useState('code');

  // Quick Blueprint Setting Modal
  const [blueprintModalOpen, setBlueprintModalOpen] = useState(false);
  const [modalTotalQuestions, setModalTotalQuestions] = useState(40);
  const [modalDuration, setModalDuration] = useState(45);
  const [modalPassingScore, setModalPassingScore] = useState(75);
  const [modalLocation, setModalLocation] = useState('Xưởng In Offset — Trạm 01');

  useEffect(() => {
    mockApi.getAssessments().then((res) => {
      // Enrich with locations and types if not present
      const list = (res.data || []).map((a, idx) => ({
        ...a,
        examType: idx % 2 === 0 ? 'official_exam' : 'practice_set',
        location: idx % 3 === 0 ? 'Xưởng In Offset — Trạm 01' : idx % 3 === 1 ? 'Xưởng SMT — Trạm 04' : 'Lab Khảo thí A',
        criticalRulesCount: 2,
      }));
      setAssessments(list);
      setLoading(false);
    });
  }, []);

  // Filtered assessments
  const filtered = useMemo(() => {
    return assessments.filter(row => Object.entries(fieldFilters).every(([key, query]) => !query || formatField({id:key}, row).toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')))).filter((a) => {
      const matchSearch =
        !search ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.code.toLowerCase().includes(search.toLowerCase()) ||
        (a.subjectName && a.subjectName.toLowerCase().includes(search.toLowerCase()));

      const matchType = !selectedType || a.examType === selectedType;
      const matchStatus = !selectedStatus || a.status === selectedStatus;
      const matchLocation = !selectedLocation || a.location === selectedLocation;

      return matchSearch && matchType && matchStatus && matchLocation;
    });
  }, [assessments, search, selectedType, selectedStatus, selectedLocation, fieldFilters]);

  // Sort
  const sortedAssessments = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortField]; const bv = b[sortField];
      const compare = typeof av === 'number' && typeof bv === 'number' ? av - bv : formatField({id: sortField}, a).localeCompare(formatField({id: sortField}, b), 'vi', {numeric:true});
      return sortAsc ? compare : -compare;
    });
  }, [filtered, sortAsc, sortField]);

  // Paged slice
  const totalPages = Math.ceil(sortedAssessments.length / pageSize) || 1;
  const currentPageSafe = Math.min(currentPage, totalPages);
  const pagedAssessments = useMemo(() => {
    const start = (currentPageSafe - 1) * pageSize;
    return sortedAssessments.slice(start, start + pageSize);
  }, [sortedAssessments, currentPageSafe, pageSize]);

  // Selection handlers
  const isAllSelected = pagedAssessments.length > 0 && pagedAssessments.every((a) => selectedIds.includes(a.id));
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pagedAssessments.some((a) => a.id === id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pagedAssessments.map((a) => a.id)])));
    }
  };

  const toggleSelectOne = (id, e) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSaveModalBlueprint = (e) => {
    e.preventDefault();
    setBlueprintModalOpen(false);
    addToast('Đã lưu cấu hình quy chuẩn bộ đề thi & đề luyện tập thành công!', 'success');
  };

  return (
    <ManagementFrame className="management-screen" header={<><Tabs tabs={[{id:'table',label:'Danh sách',icon:List},{id:'cards',label:'Dạng thẻ',icon:LayoutGrid}]} activeTab={viewMode} onChange={setViewMode} /><div className="management-actions"><div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              icon={Sliders}
              onClick={() => navigate('/manage/blueprints')}
              className="!h-8 !text-xs whitespace-nowrap"
            >
              Cấu hình quy chuẩn đề
            </Button>

            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => navigate('/manage/assessments/new')}
              className="!h-8 !text-xs whitespace-nowrap"
            >
              Tạo bộ đề mới
            </Button>
          </div></div></>} filters={<TableFilters fields={TABLE_COLUMNS} data={assessments} filters={fieldFilters} onChange={next => { setFieldFilters(next); setCurrentPage(1); }} search={search} onSearchChange={value => { setSearch(value); setCurrentPage(1); }} formatCell={formatField} />} status={<div className="contents">
        {/* Left: Summary and Selected count */}
        <div className="flex flex-wrap items-center gap-2"><strong>Bộ đề thi & Đề luyện tập</strong><div className="flex items-center gap-3">
          {selectedIds.length > 0 ? (
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold">
              <span>Đã chọn {selectedIds.length} bộ đề</span>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-xs text-slate-400 hover:text-slate-600 underline"
              >
                Bỏ chọn
              </button>
            </div>
          ) : (
            <span>
              Hiển thị{' '}
              <strong className="text-slate-900 dark:text-white">
                {sortedAssessments.length === 0
                  ? 0
                  : `${(currentPageSafe - 1) * pageSize + 1} - ${Math.min(
                      currentPageSafe * pageSize,
                      sortedAssessments.length
                    )}`}
              </strong>{' '}
              trong <strong className="text-slate-900 dark:text-white">{sortedAssessments.length}</strong> bộ đề
            </span>
          )}
        </div></div>

        {/* Right: Page Size & Pagination Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5">
            <span>Số dòng:</span>
            <Select
              size="sm"
              placement="top"
              placeholder=""
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              options={[
                { value: 12, label: '12' },
                { value: 25, label: '25' },
                { value: 50, label: '50' },
                { value: 100, label: '100' },
              ]}
              className="!w-20"
            />
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              icon={ChevronsLeft}
              disabled={currentPageSafe <= 1}
              onClick={() => setCurrentPage(1)}
              className="!h-8 !w-8 !p-0"
            />
            <Button
              variant="outline"
              size="sm"
              icon={ChevronLeft}
              disabled={currentPageSafe <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="!h-8 !w-8 !p-0"
            />
            <span className="px-2 font-semibold">
              Trang {currentPageSafe} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              icon={ChevronRight}
              disabled={currentPageSafe >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="!h-8 !w-8 !p-0"
            />
            <Button
              variant="outline"
              size="sm"
              icon={ChevronsRight}
              disabled={currentPageSafe >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="!h-8 !w-8 !p-0"
            />
          </div>
        </div>
      </div>}>
<div className="flex-1 min-h-0 w-full relative overflow-hidden bg-white dark:bg-slate-950 flex flex-col">
        {/* VIEW 1: BESPOKE WORKSTATION TABLE */}
        {viewMode === 'table' && <VirtualDataTable columns={TABLE_COLUMNS} rows={pagedAssessments} formatCell={formatField} onSort={field => { if (field !== 'actions') { setSortField(field); setSortAsc(sortField === field ? !sortAsc : true); } }} onOpen={row => navigate('/manage/assessments/' + row.id)} selectedIds={selectedIds} onSelectedIdsChange={setSelectedIds} />}

        {/* VIEW 2: BESPOKE CARD GRID */}
        {viewMode === 'cards' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {pagedAssessments.length === 0 ? (
              <div className="py-20 text-center text-slate-400 text-xs">
                Không tìm thấy bộ đề nào phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pagedAssessments.map((asm) => {
                  const isSelected = selectedIds.includes(asm.id);
                  return (
                    <div
                      key={asm.id}
                      onClick={() => navigate(`/manage/assessments/${asm.id}`)}
                      className={`rounded-md border p-4 sm:p-5 flex flex-col justify-between transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20  ring-2 ring-emerald-500/20'
                          : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 '
                      }`}
                    >
                      {/* Card Top: Code, Version & Status */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800">
                              {asm.code}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              v{asm.version || 1}
                            </span>
                          </div>

                          <Badge variant={asm.status === 'published' ? 'success' : 'warning'} size="sm">
                            {asm.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
                          </Badge>
                        </div>

                        {/* Title */}
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 hover:text-emerald-600 dark:hover:text-emerald-400 mb-2">
                          {asm.title}
                        </h2>

                        {/* Subject & Type Chips */}
                        <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                            {asm.subjectName || 'Hệ thống Smart Factory'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold">
                            {asm.examType === 'official_exam' ? '🎯 Sát hạch' : '⚡ Tự luyện'}
                          </span>
                        </div>

                        {/* Metric Bar */}
                        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-md bg-slate-50/70 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 text-center mb-3">
                          <div>
                            <div className="text-[10px] text-slate-400 font-medium">Số câu</div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center justify-center gap-1">
                              <FileText size={12} className="text-blue-500" />
                              {asm.questionCount || 40}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 font-medium">Thời gian</div>
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 flex items-center justify-center gap-1">
                              <Clock size={12} className="text-purple-500" />
                              {asm.durationMinutes || 45}'
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] text-slate-400 font-medium">Điểm đạt</div>
                            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
                              <CheckCircle size={12} className="text-emerald-500" />
                              {asm.passingScore || 7}đ
                            </div>
                          </div>
                        </div>

                        {/* Location Details */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 mb-3">
                          <MapPin size={13} className="text-amber-500 shrink-0" />
                          <span className="truncate">{asm.location}</span>
                        </div>
                      </div>

                      {/* Card Footer: Action button */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400">
                          {asm.publishedAt ? `Xuất bản: ${formatDate(asm.publishedAt, false)}` : 'Chưa xuất bản'}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/manage/assessments/${asm.id}`);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 text-slate-700 dark:text-slate-200 transition-colors"
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

</ManagementFrame>
  );
}
