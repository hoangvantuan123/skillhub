import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Folder,
  FileText,
  ChevronRight,
  ArrowLeft,
  Plus,
  Upload,
  FolderPlus,
  Settings,
  Database,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  AlertTriangle,
  Cpu,
  Monitor,
  Activity,
} from 'lucide-react';
import { mockApi } from '../../../mocks/mockService';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useToast } from '../../../shared/hooks/useToast';
import { formatDate } from '../../../shared/lib/formatters';

// Unified UI Library Components
import Button from '../../../shared/ui/Button';
import Select from '../../../shared/ui/Select';
import SearchInput from '../../../shared/ui/SearchInput';
import Modal from '../../../shared/ui/Modal';
import InteractiveHmiSimulation from '../components/InteractiveHmiSimulation';
import BatchImportQuestionsModal from '../components/BatchImportQuestionsModal';

// Configurable Columns definition
const ALL_COLUMNS = [
  { id: 'id', label: 'Mã số', defaultVisible: true, width: '110px' },
  { id: 'content', label: 'Tên / Nội dung câu hỏi', defaultVisible: true, width: '450px', fixed: true },
  { id: 'level', label: 'Cấp độ (Level)', defaultVisible: true, width: '110px' },
  { id: 'format', label: 'Dạng bài', defaultVisible: true, width: '130px' },
  { id: 'isCritical', label: 'Điểm liệt', defaultVisible: true, width: '100px' },
  { id: 'topic', label: 'Chủ đề', defaultVisible: true, width: '170px' },
  { id: 'targetGroup', label: 'Nhóm áp dụng', defaultVisible: false, width: '160px' },
  { id: 'difficulty', label: 'Độ khó', defaultVisible: false, width: '110px' },
  { id: 'version', label: 'Phiên bản', defaultVisible: false, width: '90px' },
  { id: 'author', label: 'Tác giả', defaultVisible: false, width: '140px' },
  { id: 'status', label: 'Trạng thái', defaultVisible: true, width: '120px' },
  { id: 'updatedAt', label: 'Ngày cập nhật', defaultVisible: true, width: '120px' },
  { id: 'actions', label: 'Xem', defaultVisible: true, width: '80px', align: 'center', fixed: true },
];

export default function QuestionListPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addToast } = useToast();

  // Navigation & Hierarchy
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null); // null = Root directory
  const [viewMode, setViewMode] = useState('folder'); // 'folder' | 'all'

  // Questions & Data State
  const [allQuestions, setAllQuestions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [is10kLoaded, setIs10kLoaded] = useState(false);

  // Filters (Controlled via unified components)
  const [search, setSearch] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');
  const [onlyCritical, setOnlyCritical] = useState(false);
  const [sortField, setSortField] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50); // 25, 50, 100, 200, 500

  // Selection
  const [selectedItems, setSelectedItems] = useState([]);

  // Column Visibility Configuration
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('skillhub_qb_columns');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id);
  });

  // Modals
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [columnSettingsModalOpen, setColumnSettingsModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderLevel, setNewFolderLevel] = useState('All');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState(null);

  // Column toggling
  const handleToggleColumn = (colId) => {
    if (colId === 'content' || colId === 'actions') return;
    setVisibleColumns((prev) => {
      const next = prev.includes(colId) ? prev.filter((id) => id !== colId) : [...prev, colId];
      try {
        localStorage.setItem('skillhub_qb_columns', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleResetColumns = () => {
    const defaults = ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id);
    setVisibleColumns(defaults);
    try {
      localStorage.setItem('skillhub_qb_columns', JSON.stringify(defaults));
    } catch (e) {}
    addToast('Đã khôi phục cài đặt cột mặc định', 'info');
  };

  const handleSelectAllColumns = () => {
    const all = ALL_COLUMNS.map((c) => c.id);
    setVisibleColumns(all);
    try {
      localStorage.setItem('skillhub_qb_columns', JSON.stringify(all));
    } catch (e) {}
  };

  useEffect(() => {
    loadFolders();
  }, [search, selectedLevel]);

  useEffect(() => {
    loadQuestions();
  }, [search, selectedLevel, selectedFormat, onlyCritical, currentFolder, viewMode]);

  useEffect(() => {
    setPage(1);
  }, [search, selectedLevel, selectedFormat, onlyCritical, currentFolder, viewMode, pageSize]);

  const loadFolders = async () => {
    const res = await mockApi.getQuestionFolders({
      search,
      level: selectedLevel,
    });
    setFolders(res.data || []);
  };

  const loadQuestions = async () => {
    setLoading(true);
    const filterFolderId = viewMode === 'folder' && currentFolder ? currentFolder.id : '';
    const res = await mockApi.getQuestions({
      search,
      level: selectedLevel,
      format: selectedFormat,
      isCritical: onlyCritical ? 'true' : '',
      folderId: filterFolderId,
    });
    const items = res.data || [];
    setAllQuestions(items);
    setTotalCount(items.length);
    setLoading(false);
  };

  // High-Volume 10,000 questions toggle
  const handleToggle10k = async () => {
    setLoading(true);
    if (!is10kLoaded) {
      const res = await mockApi.seed10kQuestions();
      setIs10kLoaded(true);
      addToast(`Đã nạp ${res.count.toLocaleString('vi-VN')} câu hỏi kiểm thử tải lớn!`, 'success');
    } else {
      const res = await mockApi.resetQuestionsToDefault();
      setIs10kLoaded(false);
      addToast(`Đã khôi phục về ${res.count} câu hỏi mặc định.`, 'info');
    }
    await loadQuestions();
    await loadFolders();
    setLoading(false);
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) {
      addToast('Vui lòng nhập tên thư mục!', 'warning');
      return;
    }
    await mockApi.createQuestionFolder({
      name: newFolderName.trim(),
      level: newFolderLevel,
      description: newFolderDesc.trim(),
    });
    addToast(`Đã tạo thư mục "${newFolderName}" thành công!`, 'success');
    setNewFolderName('');
    setNewFolderDesc('');
    setCreateFolderModalOpen(false);
    loadFolders();
  };

  const handleImportSuccess = async (batch) => {
    await mockApi.createQuestionsBatch(batch);
    addToast(`Nhập thành công ${batch.length} câu hỏi vào Ngân hàng!`, 'success');
    loadQuestions();
    loadFolders();
  };

  // Sorting
  const sortedFolders = useMemo(() => {
    return [...folders].sort((a, b) => {
      const cmp = a.name.localeCompare(b.name, 'vi');
      return sortAsc ? cmp : -cmp;
    });
  }, [folders, sortAsc]);

  const sortedQuestions = useMemo(() => {
    return [...allQuestions].sort((a, b) => {
      let valA = a[sortField] || a.content || '';
      let valB = b[sortField] || b.content || '';
      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(valB, 'vi');
        return sortAsc ? cmp : -cmp;
      }
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [allQuestions, sortField, sortAsc]);

  // Paginated Questions
  const totalPages = Math.max(1, Math.ceil(sortedQuestions.length / pageSize));
  const currentPageSafe = Math.min(Math.max(1, page), totalPages);
  const pagedQuestions = useMemo(() => {
    const startIndex = (currentPageSafe - 1) * pageSize;
    return sortedQuestions.slice(startIndex, startIndex + pageSize);
  }, [sortedQuestions, currentPageSafe, pageSize]);

  // Active columns for questions
  const activeQuestionColumns = useMemo(() => {
    return ALL_COLUMNS.filter((c) => visibleColumns.includes(c.id));
  }, [visibleColumns]);

  // Selection
  const activeList = viewMode === 'folder' && !currentFolder ? sortedFolders : pagedQuestions;
  const isAllSelected = activeList.length > 0 && activeList.every((item) => selectedItems.includes(item.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedItems([]);
    } else {
      setSelectedItems(activeList.map((item) => item.id));
    }
  };

  const toggleSelectItem = (id, e) => {
    e?.stopPropagation();
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Helper for Level Icons and Colors
  const getLevelMeta = (lvl) => {
    switch (lvl) {
      case 'L0':
        return { label: 'Level 0 — Thiết bị', color: 'text-rose-600', dot: 'bg-rose-500' };
      case 'L1':
        return { label: 'Level 1 — PLC & Control', color: 'text-amber-600', dot: 'bg-amber-500' };
      case 'L2':
        return { label: 'Level 2 — SCADA & HMI', color: 'text-blue-600', dot: 'bg-blue-500' };
      case 'L3':
        return { label: 'Level 3 — MES & MOM', color: 'text-emerald-600', dot: 'bg-emerald-500' };
      default:
        return { label: 'Chung', color: 'text-slate-600', dot: 'bg-slate-400' };
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-white dark:bg-slate-950 select-none">
      {/* 1. ENTERPRISE UNDERLINE NAVIGATION TABS */}
      <div className="flex items-center justify-between px-4 pt-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
        <div className="flex items-center gap-6 -mb-px">
          {/* Tab 1: Folders */}
          <button
            type="button"
            onClick={() => {
              setViewMode('folder');
              setCurrentFolder(null);
            }}
            className={`flex items-center gap-2 pb-2.5 font-medium text-xs sm:text-sm transition-all border-b-2 ${
              viewMode === 'folder'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Folder size={16} />
            <span>Theo thư mục phân loại</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                viewMode === 'folder'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {sortedFolders.length} thư mục
            </span>
          </button>

          {/* Tab 2: All Questions */}
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`flex items-center gap-2 pb-2.5 font-medium text-xs sm:text-sm transition-all border-b-2 ${
              viewMode === 'all'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <FileText size={16} />
            <span>Tất cả câu hỏi</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                viewMode === 'all'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {totalCount.toLocaleString('vi-VN')} câu
            </span>
          </button>
        </div>
      </div>

      {/* 2. UNIFIED WORKSTATION TOOLBAR */}
      <div className="flex flex-col gap-2.5 p-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
        {/* Row 1: Breadcrumbs & Primary Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Breadcrumb Navigation - with Company Logo Icon */}
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span
              onClick={() => {
                setCurrentFolder(null);
                setViewMode('folder');
              }}
              className={`flex items-center gap-2 transition-colors ${
                currentFolder ? 'text-emerald-700 dark:text-emerald-400 cursor-pointer hover:underline' : 'text-slate-900 dark:text-white'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center">
                <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              </div>
              <span>Ngân hàng câu hỏi</span>
            </span>

            {currentFolder && (
              <>
                <ChevronRight size={16} className="text-slate-400" />
                <span className="flex items-center gap-1.5 text-slate-900 dark:text-white">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
                  {currentFolder.name}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  icon={ArrowLeft}
                  onClick={() => setCurrentFolder(null)}
                  className="ml-2 !h-7 !px-2.5 !text-xs"
                >
                  Lên một cấp
                </Button>
              </>
            )}
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 shrink-0">
            {/* High Volume Stress Test Button */}
            <Button
              variant={is10kLoaded ? 'secondary' : 'outline'}
              size="sm"
              icon={Database}
              onClick={handleToggle10k}
              className={`!h-8 !text-xs whitespace-nowrap ${is10kLoaded ? '!text-emerald-700 !bg-emerald-50 !border-emerald-300 dark:!bg-emerald-950/50 dark:!text-emerald-300 dark:!border-emerald-800' : ''}`}
            >
              {is10kLoaded ? '10k+ (Reset)' : '10,000+ mẫu'}
            </Button>

            {/* Column Customizer Button */}
            <Button
              variant="outline"
              size="sm"
              icon={Settings}
              onClick={() => setColumnSettingsModalOpen(true)}
              className="!h-8 !text-xs whitespace-nowrap"
            >
              Cài đặt cột ({visibleColumns.length})
            </Button>

            <Button
              variant="secondary"
              size="sm"
              icon={FolderPlus}
              onClick={() => setCreateFolderModalOpen(true)}
              className="!h-8 !text-xs whitespace-nowrap"
            >
              Tạo thư mục
            </Button>

            <Button
              variant="secondary"
              size="sm"
              icon={Upload}
              onClick={() => setImportModalOpen(true)}
              className="!h-8 !text-xs whitespace-nowrap"
            >
              Import
            </Button>

            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => navigate('/manage/questions/new')}
              className="!h-8 !text-xs whitespace-nowrap"
            >
              Soạn câu hỏi
            </Button>
          </div>
        </div>

        {/* Row 2: Unified Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 w-full flex-wrap">
            {/* Unified Search Input */}
            <div className="w-full sm:w-72 md:w-80">
              <SearchInput
                size="sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch('')}
                placeholder={
                  viewMode === 'folder' && !currentFolder
                    ? 'Tìm kiếm thư mục nhóm câu hỏi...'
                    : 'Tìm mã, nội dung câu hỏi...'
                }
              />
            </div>

            {/* Unified Select: Level */}
            <div className="w-full sm:w-48">
              <Select
                size="sm"
                placeholder="Tất cả Cấp độ (Level)"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                options={[
                  { value: 'L0', label: 'Cấp L0 — Cảm biến & Cơ cấu' },
                  { value: 'L1', label: 'Cấp L1 — PLC & Điều khiển' },
                  { value: 'L2', label: 'Cấp L2 — SCADA & HMI' },
                  { value: 'L3', label: 'Cấp L3 — MES / MOM' },
                ]}
              />
            </div>

            {/* Unified Select: Format */}
            {(currentFolder || viewMode === 'all') && (
              <div className="w-full sm:w-44">
                <Select
                  size="sm"
                  placeholder="Tất cả Dạng bài"
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  options={[
                    { value: 'theory', label: 'Trắc nghiệm' },
                    { value: 'simulation_hmi', label: 'Mô phỏng HMI' },
                    { value: 'case_study', label: 'Tình huống' },
                    { value: 'essay', label: 'Tự luận' },
                  ]}
                />
              </div>
            )}

            {/* Critical Filter Toggle Button */}
            <Button
              variant={onlyCritical ? 'danger' : 'outline'}
              size="sm"
              onClick={() => setOnlyCritical(!onlyCritical)}
              className="!h-8 !text-xs whitespace-nowrap self-start sm:self-auto"
            >
              {onlyCritical ? 'Đang lọc: Điểm liệt' : 'Lọc: Điểm liệt'}
            </Button>
          </div>
        </div>
      </div>

      {/* 2. MAIN VIEWPORT: BESPOKE WORKSTATION GRID */}
      <div className="flex-1 min-h-0 w-full relative overflow-hidden bg-white dark:bg-slate-950">
        <div className="w-full h-full flex flex-col overflow-hidden bg-white dark:bg-slate-950">
          {/* Workstation Header Bar (Desktop & Tablet) */}
          <div className="hidden md:grid grid-cols-12 items-center px-4 py-2.5 bg-slate-100/90 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 select-none shrink-0 sticky top-0 z-10">
            <div className="col-span-1 flex items-center gap-2">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="rounded border-slate-300 dark:border-slate-600 text-emerald-600 cursor-pointer"
              />
              <span>Mã</span>
            </div>
            <div className="col-span-5 flex items-center cursor-pointer hover:text-slate-900 dark:hover:text-white" onClick={() => setSortAsc(!sortAsc)}>
              <span>{viewMode === 'folder' && !currentFolder ? 'Tên thư mục / Nhóm câu hỏi' : 'Tên / Nội dung câu hỏi'}</span>
            </div>
            <div className="col-span-2 text-slate-600 dark:text-slate-300">Phân loại / Cấp độ</div>
            <div className="col-span-1 text-slate-600 dark:text-slate-300">{viewMode === 'folder' && !currentFolder ? 'Số lượng' : 'Dạng bài'}</div>
            <div className="col-span-1 text-slate-600 dark:text-slate-300">Điểm liệt</div>
            <div className="col-span-1 text-slate-600 dark:text-slate-300">Cập nhật</div>
            <div className="col-span-1 text-right text-slate-600 dark:text-slate-300">Thao tác</div>
          </div>

          {/* Workstation Header Bar (Mobile only) */}
          <div className="md:hidden flex items-center justify-between px-3.5 py-2 bg-slate-100/90 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="rounded border-slate-300 dark:border-slate-600 text-emerald-600 cursor-pointer"
              />
              <span>Chọn tất cả ({viewMode === 'folder' && !currentFolder ? sortedFolders.length : sortedQuestions.length})</span>
            </div>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="text-xs text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium"
            >
              Sắp xếp {sortAsc ? '↑' : '↓'}
            </button>
          </div>

          {/* Scrollable Workstation Rows */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-950">
            {/* VIEW 1: FOLDER LISTING */}
            {viewMode === 'folder' && !currentFolder && (
              <>
                {sortedFolders.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs">
                    Không tìm thấy thư mục nhóm câu hỏi nào phù hợp với điều kiện tìm kiếm.
                  </div>
                ) : (
                  sortedFolders.map((f) => {
                    const isSelected = selectedItems.includes(f.id);
                    return (
                      <React.Fragment key={f.id}>
                        {/* Desktop Table Row */}
                        <div
                          onClick={() => setCurrentFolder(f)}
                          className={`hidden md:grid grid-cols-12 items-center px-4 py-3 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/40'
                              : 'bg-white dark:bg-slate-950 hover:bg-slate-50/80 dark:hover:bg-slate-900'
                          }`}
                        >
                          <div className="col-span-1 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => toggleSelectItem(f.id, e)}
                              className="rounded border-slate-300 dark:border-slate-600 text-emerald-600 cursor-pointer"
                            />
                            <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">DIR</span>
                          </div>

                          <div className="col-span-5 pr-4">
                            <span className="font-semibold text-xs text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 truncate block">
                              {f.name}
                            </span>
                            {f.description && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {f.description}
                              </div>
                            )}
                          </div>

                          <div className="col-span-2">
                            <span className="font-semibold text-xs text-blue-600 dark:text-blue-400">
                              {f.level === 'All' ? 'Chung (L0-L3)' : `Level ${f.level?.replace('L', '')}`}
                            </span>
                          </div>

                          <div className="col-span-1 text-xs text-slate-700 dark:text-slate-200 font-medium">
                            {f.questionCount} câu
                          </div>

                          <div className="col-span-1 text-xs">
                            {f.criticalCount > 0 ? (
                              <span className="font-semibold text-rose-600 dark:text-rose-400">{f.criticalCount} câu liệt</span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">—</span>
                            )}
                          </div>

                          <div className="col-span-1 text-xs text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                            {formatDate(f.updatedAt)}
                          </div>

                          <div className="col-span-1 flex justify-end" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setCurrentFolder(f)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                            >
                              Mở thư mục
                            </button>
                          </div>
                        </div>

                        {/* Mobile Optimized Card View */}
                        <div
                          onClick={() => setCurrentFolder(f)}
                          className={`md:hidden p-3.5 flex flex-col gap-2 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/40'
                              : 'bg-white dark:bg-slate-950 hover:bg-slate-50/80 dark:hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => toggleSelectItem(f.id, e)}
                                className="rounded border-slate-300 dark:border-slate-600 text-emerald-600 cursor-pointer shrink-0"
                              />
                              <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                                {f.name}
                              </span>
                            </div>
                            <span className="font-semibold text-[11px] text-blue-600 dark:text-blue-400 shrink-0">
                              {f.level === 'All' ? 'Chung' : `Level ${f.level?.replace('L', '')}`}
                            </span>
                          </div>

                          {f.description && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 pl-6">
                              {f.description}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-900">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-700 dark:text-slate-200">{f.questionCount} câu</span>
                              {f.criticalCount > 0 && (
                                <span className="text-rose-600 dark:text-rose-400 font-semibold">• {f.criticalCount} câu liệt</span>
                              )}
                              <span>•</span>
                              <span className="font-mono text-[10px]">{formatDate(f.updatedAt)}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setCurrentFolder(f)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400"
                            >
                              Mở thư mục
                            </button>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
              </>
            )}

            {/* VIEW 2: QUESTIONS LIST */}
            {(currentFolder || viewMode === 'all') && (
              <>
                {pagedQuestions.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-xs">
                    {loading ? 'Đang tải dữ liệu...' : 'Không có câu hỏi nào trong danh mục này.'}
                  </div>
                ) : (
                  pagedQuestions.map((q) => {
                    const isSelected = selectedItems.includes(q.id);
                    const levelMeta = getLevelMeta(q.level);
                    return (
                      <React.Fragment key={q.id}>
                        {/* Desktop Table Row */}
                        <div
                          onClick={() => setPreviewQuestion(q)}
                          className={`hidden md:grid grid-cols-12 items-center px-4 py-2.5 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-emerald-50/60 dark:bg-emerald-950/40'
                              : 'bg-white dark:bg-slate-950 hover:bg-slate-50/80 dark:hover:bg-slate-900'
                          }`}
                        >
                          <div className="col-span-1 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => toggleSelectItem(q.id, e)}
                              className="rounded border-slate-300 dark:border-slate-600 text-emerald-600 cursor-pointer"
                            />
                            <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate">
                              #{q.id.replace('q-', '')}
                            </span>
                          </div>

                          <div className="col-span-5 pr-4">
                            <div className="font-medium text-xs text-slate-900 dark:text-slate-100 line-clamp-2 leading-relaxed">
                              {q.content}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                              <span>Chủ đề: <strong>{q.topicName || 'Chung'}</strong></span>
                              <span>•</span>
                              <span>v{q.version || 1}</span>
                              {q.status === 'published' ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">• Đã xuất bản</span>
                              ) : (
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">• Chờ duyệt</span>
                              )}
                            </div>
                          </div>

                          <div className="col-span-2">
                            <span className={`text-xs font-semibold ${levelMeta.color}`}>
                              {levelMeta.label}
                            </span>
                          </div>

                          <div className="col-span-1 text-xs text-slate-700 dark:text-slate-200 font-medium">
                            {q.format === 'simulation_hmi' ? (
                              <span className="text-sky-600 dark:text-sky-400 font-semibold">Mô phỏng HMI</span>
                            ) : q.format === 'case_study' ? (
                              <span className="text-purple-600 dark:text-purple-400 font-semibold">Tình huống</span>
                            ) : (
                              <span>Trắc nghiệm</span>
                            )}
                          </div>

                          <div className="col-span-1 text-xs">
                            {q.isCritical ? (
                              <span className="font-bold text-rose-600 dark:text-rose-400">Điểm liệt</span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">—</span>
                            )}
                          </div>

                          <div className="col-span-1 text-xs text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                            {formatDate(q.updatedAt)}
                          </div>

                          <div className="col-span-1 flex justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewQuestion(q);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              Xem
                            </button>
                          </div>
                        </div>

                        {/* Mobile Optimized Card View */}
                        <div
                          onClick={() => setPreviewQuestion(q)}
                          className={`md:hidden p-3.5 flex flex-col gap-2 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/40'
                              : 'bg-white dark:bg-slate-950 hover:bg-slate-50/80 dark:hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => toggleSelectItem(q.id, e)}
                                className="rounded border-slate-300 dark:border-slate-600 text-emerald-600 cursor-pointer shrink-0"
                              />
                              <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                #{q.id.replace('q-', '')}
                              </span>
                              <span className={`text-[11px] font-bold ${levelMeta.color}`}>
                                {q.level}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {q.isCritical && (
                                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded">
                                  Điểm liệt
                                </span>
                              )}
                              {q.status === 'published' ? (
                                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded font-medium">
                                  Đã xuất bản
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded font-medium">
                                  Chờ duyệt
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="font-medium text-xs text-slate-900 dark:text-slate-100 line-clamp-2 leading-relaxed pl-6">
                            {q.content}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-900">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span>{q.topicName || 'Chung'}</span>
                              <span>•</span>
                              <span>
                                {q.format === 'simulation_hmi' ? (
                                  <strong className="text-sky-600 dark:text-sky-400 font-semibold">Mô phỏng HMI</strong>
                                ) : q.format === 'case_study' ? (
                                  <strong className="text-purple-600 dark:text-purple-400 font-semibold">Tình huống</strong>
                                ) : (
                                  'Trắc nghiệm'
                                )}
                              </span>
                              <span>•</span>
                              <span className="font-mono text-[10px]">{formatDate(q.updatedAt)}</span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewQuestion(q);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 shrink-0"
                            >
                              Xem
                            </button>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. WORKSTATION STATUS & PAGINATION FOOTER */}
      <div className="border-t border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-2 sm:h-10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 shrink-0 select-none">
        {/* Left: Metadata info */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          {viewMode === 'folder' && !currentFolder ? (
            <span>
              Tổng số: <strong className="text-slate-900 dark:text-white">{sortedFolders.length}</strong> thư mục | Đang chọn:{' '}
              <strong className="text-slate-900 dark:text-white">{selectedItems.length}</strong>
            </span>
          ) : (
            <span>
              {currentFolder && (
                <>
                  Thư mục: <strong className="text-blue-700 dark:text-blue-400">{currentFolder.name}</strong> •{' '}
                </>
              )}
              Hiển thị{' '}
              <strong className="text-slate-900 dark:text-white">
                {sortedQuestions.length === 0
                  ? 0
                  : `${(currentPageSafe - 1) * pageSize + 1} - ${Math.min(
                      currentPageSafe * pageSize,
                      sortedQuestions.length
                    )}`}
              </strong>{' '}
              trong <strong className="text-slate-900 dark:text-white">{sortedQuestions.length.toLocaleString('vi-VN')}</strong> câu
            </span>
          )}
        </div>

        {/* Right: Fast Pagination */}
        {(currentFolder || viewMode === 'all') && sortedQuestions.length > 0 && (
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
                  setPage(1);
                }}
                options={[
                  { value: 25, label: '25' },
                  { value: 50, label: '50' },
                  { value: 100, label: '100' },
                  { value: 200, label: '200' },
                  { value: 500, label: '500' },
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
                onClick={() => setPage(1)}
                className="!h-7 !w-7 !p-0"
              />
              <Button
                variant="outline"
                size="sm"
                icon={ChevronLeft}
                disabled={currentPageSafe <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="!h-7 !w-7 !p-0"
              />

              <span className="mx-1 text-slate-700 dark:text-slate-300">
                Trang <strong className="text-slate-900 dark:text-white">{currentPageSafe}</strong> / {totalPages.toLocaleString('vi-VN')}
              </span>

              <Button
                variant="outline"
                size="sm"
                icon={ChevronRight}
                disabled={currentPageSafe >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="!h-7 !w-7 !p-0"
              />
              <Button
                variant="outline"
                size="sm"
                icon={ChevronsRight}
                disabled={currentPageSafe >= totalPages}
                onClick={() => setPage(totalPages)}
                className="!h-7 !w-7 !p-0"
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. MODALS (Full-Screen Black Backdrop Portal Modals) */}
      {/* Modal: Column Settings */}
      <Modal
        open={columnSettingsModalOpen}
        onClose={() => setColumnSettingsModalOpen(false)}
        title="Tùy chỉnh cột hiển thị trong bảng câu hỏi"
        size="lg"
      >
        <div className="flex flex-col gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tích chọn các trường thông tin bạn muốn hiển thị trên trạm làm việc. Cài đặt được lưu tự động.
          </p>

          <div className="grid grid-cols-2 gap-2 p-3.5 border border-slate-200/80 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-xs shadow-xs">
            {ALL_COLUMNS.map((col) => {
              const isChecked = visibleColumns.includes(col.id);
              const isLocked = col.id === 'content' || col.id === 'actions';
              return (
                <label
                  key={col.id}
                  className={`flex items-center gap-2 select-none ${
                    isLocked ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed' : 'text-slate-800 dark:text-slate-200 cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isLocked}
                    onChange={() => handleToggleColumn(col.id)}
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>{col.label}</span>
                  {isLocked && <span className="text-[10px] text-slate-400">(Bắt buộc)</span>}
                </label>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={handleSelectAllColumns}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Chọn tất cả
              </button>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <button
                type="button"
                onClick={handleResetColumns}
                className="text-slate-600 dark:text-slate-400 hover:underline"
              >
                Mặc định
              </button>
            </div>

            <Button variant="primary" size="sm" onClick={() => setColumnSettingsModalOpen(false)}>
              Đóng & Lưu cấu hình
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Tạo thư mục mới */}
      <Modal
        open={createFolderModalOpen}
        onClose={() => setCreateFolderModalOpen(false)}
        title="Tạo thư mục câu hỏi mới"
        size="md"
      >
        <form onSubmit={handleCreateFolder} className="flex flex-col gap-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Tên thư mục phân loại <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Ví dụ: Kỹ thuật Điều khiển Máy In Offset, Cảm biến & Đo lường..."
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 focus:border-emerald-600 dark:focus:border-emerald-500 focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Cấp độ áp dụng (ISA-95 Level)
            </label>
            <Select
              placeholder=""
              value={newFolderLevel}
              onChange={(e) => setNewFolderLevel(e.target.value)}
              options={[
                { value: 'All', label: 'Chung (Tất cả cấp độ L0 - L3)' },
                { value: 'L0', label: 'Level 0 — Thiết bị trường & Cảm biến' },
                { value: 'L1', label: 'Level 1 — PLC & Điều khiển máy' },
                { value: 'L2', label: 'Level 2 — SCADA & Giao diện HMI' },
                { value: 'L3', label: 'Level 3 — MES / MOM & ERP Liên vận' },
              ]}
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Mô tả ngắn
            </label>
            <textarea
              rows={2}
              value={newFolderDesc}
              onChange={(e) => setNewFolderDesc(e.target.value)}
              placeholder="Ghi chú quy trình sản xuất, công đoạn hoặc đối tượng học tập..."
              className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 focus:border-emerald-600 dark:focus:border-emerald-500 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setCreateFolderModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Tạo thư mục
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Batch Import Questions */}
      <BatchImportQuestionsModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      {/* Modal: Question Detail Preview & Simulation */}
      {previewQuestion && (
        <Modal
          open={!!previewQuestion}
          onClose={() => setPreviewQuestion(null)}
          title={`Chi tiết câu hỏi #${previewQuestion.id}`}
          size="xl"
        >
          <div className="flex flex-col gap-3 text-xs text-slate-800 dark:text-slate-200">
            {/* Meta info header */}
            <div className="flex items-center gap-3 flex-wrap p-3 rounded-xl bg-slate-50/60 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <div>
                Cấp độ:{' '}
                <strong className="text-blue-700 dark:text-blue-400">
                  {previewQuestion.level || 'L3'}
                </strong>
              </div>
              <div>
                Dạng bài: <strong>{previewQuestion.format}</strong>
              </div>
              <div>
                Điểm liệt:{' '}
                {previewQuestion.isCritical ? (
                  <strong className="text-rose-600 dark:text-rose-400">Có (Bắt buộc đúng 100%)</strong>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400">Không</span>
                )}
              </div>
              <div>
                Trạng thái:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {previewQuestion.status === 'published' ? 'Đã xuất bản' : previewQuestion.status}
                </strong>
              </div>
            </div>

            {/* Question Content */}
            <div className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
              {previewQuestion.content}
            </div>

            {/* If question has interactive HMI simulation */}
            {previewQuestion.format === 'simulation_hmi' && (
              <div className="mt-1">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Bảng Điều Khiển Mô Phỏng HMI / SCADA Trực Quan:
                </div>
                <InteractiveHmiSimulation
                  question={previewQuestion}
                  onComplete={() => addToast('Mô phỏng thành công! Đã ghi nhận thao tác đúng.', 'success')}
                />
              </div>
            )}

            {/* Options display */}
            {previewQuestion.options && (
              <div className="flex flex-col gap-1.5 mt-1">
                <div className="font-bold text-slate-700 dark:text-slate-300">Các lựa chọn:</div>
                {previewQuestion.options.map((opt, oIdx) => (
                  <div
                    key={opt.id || oIdx}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                      opt.isCorrect
                        ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 dark:border-emerald-700 text-slate-900 dark:text-slate-100'
                        : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{opt.text}</span>
                    {opt.isCorrect && (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                        Đáp án đúng
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {previewQuestion.explanation && (
              <div className="p-3 rounded-xl bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/40 text-slate-700 dark:text-slate-200 leading-relaxed text-xs">
                <strong className="text-emerald-700 dark:text-emerald-400">Giải thích chi tiết: </strong>
                {previewQuestion.explanation}
              </div>
            )}

            {/* Actions in Modal */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setPreviewQuestion(null)}>
                Đóng
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const id = previewQuestion.id;
                  setPreviewQuestion(null);
                  navigate(`/manage/questions/${id}/edit`);
                }}
              >
                Chỉnh sửa câu hỏi này
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
