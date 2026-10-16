import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchInput from '../../../shared/ui/SearchInput';
import Select from '../../../shared/ui/Select';
import Button from '../../../shared/ui/Button';
import Badge from '../../../shared/ui/Badge';
import { mockApi } from '../../../mocks/mockService';
import { formatDate } from '../../../shared/lib/formatters';
import {
  Calendar,
  Clock,
  Users,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  LayoutGrid,
  List,
  MapPin,
  FileText,
  Sliders,
  Plus,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Layers,
} from 'lucide-react';

export default function ExamListPage() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  // View Mode: 'cards' | 'table' (Support both!)
  const [viewMode, setViewMode] = useState('cards');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
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
    return exams.filter((e) => {
      const matchSearch =
        !search ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.code.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !selectedStatus || e.status === selectedStatus;
      const matchLocation = !selectedLocation || e.location === selectedLocation;
      return matchSearch && matchStatus && matchLocation;
    });
  }, [exams, search, selectedStatus, selectedLocation]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const currentPageSafe = Math.min(currentPage, totalPages);
  const pagedExams = useMemo(() => {
    const start = (currentPageSafe - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPageSafe, pageSize]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-slate-950">
      {/* 1. TOP CONTROL BAR */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 p-3 sm:p-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Layers size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Tổ chức Ca thi & Kỳ thi Sát hạch
                </h1>
                <span className="hidden md:inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {exams.length} ca thi
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Lịch trình khảo thí, trạm thi thực tế, hạn nộp cứng và phòng thi trực tuyến.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Sliders}
              onClick={() => navigate('/manage/blueprints')}
              className="!h-8 !text-xs whitespace-nowrap"
            >
              Cấu hình đề thi & luyện
            </Button>
          </div>
        </div>

        {/* Row 2: Filters & View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 w-full flex-wrap">
            <div className="w-full sm:w-64 md:w-72">
              <SearchInput
                size="sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch('')}
                placeholder="Tìm kiếm tên kỳ thi, mã ca thi..."
              />
            </div>

            <div className="w-full sm:w-44">
              <Select
                size="sm"
                placeholder="Tất cả trạng thái"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                options={[
                  { value: 'scheduled', label: 'Sắp diễn ra' },
                  { value: 'in_progress', label: 'Đang mở ca' },
                  { value: 'completed', label: 'Đã hoàn tất' },
                ]}
              />
            </div>

            <div className="w-full sm:w-48">
              <Select
                size="sm"
                placeholder="Tất cả vị trí / xưởng"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                options={[
                  { value: 'Xưởng In Offset — Trạm HMI 01', label: 'Xưởng In Offset' },
                  { value: 'Xưởng SMT — Dây chuyền 04', label: 'Xưởng SMT 04' },
                ]}
              />
            </div>
          </div>

          {/* View Mode Toggle: Card Grid vs Table */}
          <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-900 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Dạng thẻ"
            >
              <LayoutGrid size={14} />
              <span className="hidden md:inline">Thẻ</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Dạng bảng"
            >
              <List size={14} />
              <span className="hidden md:inline">Bảng</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN VIEWPORT */}
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
                    className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all"
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
                      <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 text-xs mb-3">
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
        {viewMode === 'table' && (
          <div className="w-full h-full flex flex-col overflow-hidden">
            <div className="hidden md:grid grid-cols-12 items-center px-4 py-2.5 bg-slate-100/90 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0 sticky top-0 z-10">
              <div className="col-span-2">Mã ca thi</div>
              <div className="col-span-4">Tên kỳ thi / Nội dung</div>
              <div className="col-span-1 text-center">Thời lượng</div>
              <div className="col-span-2">Thời gian mở ca</div>
              <div className="col-span-1">Vị trí thi</div>
              <div className="col-span-1">Trạng thái</div>
              <div className="col-span-1 text-right">Thao tác</div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-950">
              {pagedExams.map((exam) => (
                <div
                  key={exam.id}
                  onClick={() => navigate(`/app/exams/${exam.id}`)}
                  className="grid grid-cols-1 md:grid-cols-12 items-center px-4 py-3 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-900 transition-colors text-xs"
                >
                  <div className="md:col-span-2 font-mono font-bold text-blue-600 dark:text-blue-400">
                    {exam.code}
                  </div>
                  <div className="md:col-span-4 pr-3">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                      {exam.title}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {exam.description}
                    </div>
                  </div>
                  <div className="md:col-span-1 text-center font-bold text-slate-800 dark:text-slate-200">
                    {exam.durationMinutes} phút
                  </div>
                  <div className="md:col-span-2 text-slate-500 dark:text-slate-400">
                    {formatDate(exam.startTime)}
                  </div>
                  <div className="md:col-span-1 text-slate-500 dark:text-slate-400 truncate">
                    {exam.location?.split('—')[0] || 'Xưởng thi'}
                  </div>
                  <div className="md:col-span-1">
                    <Badge variant="success" size="sm">{exam.statusLabel || 'Đang mở'}</Badge>
                  </div>
                  <div className="md:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => navigate(`/app/exams/${exam.id}`)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 transition-colors"
                    >
                      Chi tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. PAGINATION FOOTER */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200/90 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 shrink-0 select-none">
        <div>
          Hiển thị <strong className="text-slate-900 dark:text-white">{pagedExams.length}</strong> trong <strong className="text-slate-900 dark:text-white">{filtered.length}</strong> ca thi
        </div>
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
      </div>
    </div>
  );
}
