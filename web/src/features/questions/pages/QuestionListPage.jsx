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
} from 'lucide-react';
import { mockApi } from '../../../mocks/mockService';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useToast } from '../../../shared/hooks/useToast';

// Unified UI Library Components
import Button from '../../../shared/ui/Button';
import Select from '../../../shared/ui/Select';
import FilterToggleMenu from '../../../shared/ui/FilterToggleMenu';
import useAttributeCatalog from '../../../shared/hooks/useAttributeCatalog';
import AttributeCatalogModal from '../../catalog/components/AttributeCatalogModal';
import ManagementFrame from '../../../shared/ui/ManagementFrame';
import QuestionTable, { getFieldText } from '../components/QuestionTable';
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

const FOLDER_COLUMNS = [
  { id: 'name', label: 'Tên thư mục', width: 360 },
  { id: 'description', label: 'Mô tả', width: 400 },
  { id: 'level', label: 'Cấp độ', width: 140 },
  { id: 'questionCount', label: 'Số câu hỏi', width: 130 },
  { id: 'criticalCount', label: 'Điểm liệt', width: 140 },
  { id: 'updatedAt', label: 'Cập nhật', width: 150 },
  { id: 'actions', label: 'Thao tác', width: 100 },
];
const normalizeFilter = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLocaleLowerCase('vi').trim();

export default function QuestionListPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const levelCatalog = useAttributeCatalog('level');
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);
  const formatField = (column, row) => column.id === 'level' ? levelCatalog.labelFor(row.level) : getFieldText(column, row);

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
  const [fieldFilters, setFieldFilters] = useState({ folders: { level: '' }, questions: { level: '', format: '', isCritical: '' } });
  const isFolderRoot = viewMode === 'folder' && !currentFolder;
  const filterScope = isFolderRoot ? 'folders' : 'questions';
  const filters = fieldFilters[filterScope] || {};
  const filterColumns = (isFolderRoot ? FOLDER_COLUMNS : ALL_COLUMNS).filter(column => column.id !== 'actions');
  const activeFilterCount = Object.values(filters).filter(value => String(value).trim()).length;
  const matchesFilters = row => Object.entries(filters).every(([field, query]) => {
    if (!String(query).trim()) return true;
    const value = formatField({ id: field }, row);
    return ['level', 'format', 'status', 'isCritical'].includes(field)
      ? value === query
      : normalizeFilter(value).includes(normalizeFilter(query));
  });
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
  }, [search, selectedLevel, selectedFormat, onlyCritical, currentFolder, viewMode, pageSize, fieldFilters]);

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
    if (levelCatalog.loading || levelCatalog.error || !levelCatalog.options.some(option => option.value === newFolderLevel && option.active)) {
      addToast('Vui lòng chọn cấp độ đang sử dụng trong danh mục.', 'warning');
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
    return folders.filter(row => isFolderRoot ? matchesFilters(row) : true).sort((a, b) => {
      const cmp = a.name.localeCompare(b.name, 'vi');
      return sortAsc ? cmp : -cmp;
    });
  }, [folders, sortAsc, fieldFilters, filterScope, levelCatalog.options]);

  const sortedQuestions = useMemo(() => {
    return allQuestions.filter(row => !isFolderRoot ? matchesFilters(row) : true).sort((a, b) => {
      let valA = a[sortField] || a.content || '';
      let valB = b[sortField] || b.content || '';
      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(valB, 'vi');
        return sortAsc ? cmp : -cmp;
      }
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [allQuestions, sortField, sortAsc, fieldFilters, filterScope, levelCatalog.options]);

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
  return (
    <ManagementFrame className="management-screen">
      {/* 1. ENTERPRISE UNDERLINE NAVIGATION TABS */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 pt-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
        <div className="flex items-center gap-6 -mb-px shrink-0">
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
          {/* Primary Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap pb-2.5 shrink-0">
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

            <Button variant="outline" size="sm" icon={Settings} onClick={() => setCatalogModalOpen(true)}>Danh mục cấp độ</Button>
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

      {/* 2. UNIFIED WORKSTATION TOOLBAR */}
      <div className="flex flex-col gap-2.5 p-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shrink-0">
        {/* Current folder navigation */}
          {currentFolder && viewMode === 'folder' && (
            <div className="flex items-center gap-2 text-xs min-w-0">
              <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => setCurrentFolder(null)}>Lên một cấp</Button>
              <span className="truncate font-semibold">{currentFolder.name}</span>
            </div>
          )}


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

            {filterColumns.filter(column => Object.hasOwn(filters, column.id)).map(column => {
              const categorical = !['id', 'content', 'name', 'description'].includes(column.id);
              const options = categorical ? [...new Set((isFolderRoot ? folders : allQuestions).map(row => formatField(column, row)))].filter(Boolean).sort((a, b) => a.localeCompare(b, 'vi')).map(value => ({ value, label: value })) : [];
              const update = value => setFieldFilters(previous => ({ ...previous, [filterScope]: { ...previous[filterScope], [column.id]: value } }));
              return <div key={column.id} className="flex items-center gap-1 w-full sm:w-auto">
                {categorical ? <Select className="w-full sm:w-52" size="sm" placeholder={`Tất cả ${column.label}`} value={filters[column.id] || ''} options={options} onChange={event => update(event.target.value)} /> : <input aria-label={`Lọc ${column.label}`} className="h-8 w-full sm:w-52 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs focus:border-emerald-500" value={filters[column.id] || ''} onChange={event => update(event.target.value)} placeholder={`Lọc ${column.label.toLocaleLowerCase('vi')}…`} />}
              </div>;
            })}
            <FilterToggleMenu
              columns={filterColumns}
              filters={filters}
              onToggle={field => setFieldFilters(previous => {
                const next = { ...previous[filterScope] };
                if (Object.hasOwn(next, field)) delete next[field];
                else next[field] = '';
                return { ...previous, [filterScope]: next };
              })}
            />
            {activeFilterCount > 0 && <button type="button" className="text-xs text-slate-500 hover:text-emerald-700" onClick={() => setFieldFilters(previous => ({ ...previous, [filterScope]: Object.fromEntries(Object.keys(filters).map(field => [field, ''])) }))}>Xóa điều kiện ({activeFilterCount})</button>}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 w-full overflow-hidden bg-white dark:bg-slate-950">
        {activeList.length === 0 ? (
          <div className="p-12 text-center text-slate-500" role="status">
            {loading ? 'Đang tải dữ liệu...' : 'Không có dữ liệu phù hợp với bộ lọc.'}
          </div>
        ) : (
          <QuestionTable
            columns={isFolderRoot ? FOLDER_COLUMNS : activeQuestionColumns}
            rows={activeList}
            formatCell={formatField}
            onOpen={viewMode === 'folder' && !currentFolder ? setCurrentFolder : setPreviewQuestion}
            selectedIds={selectedItems}
            onSelectedIdsChange={setSelectedItems}
            onSort={(field) => {
              if (!field || field === 'actions') return;
              setSortField(field);
              setSortAsc(sortField === field ? !sortAsc : true);
            }}
          />
        )}
      </div>

      {/* 3. WORKSTATION STATUS & PAGINATION FOOTER */}
      <div className="border-t border-slate-200 dark:border-slate-800 px-3 sm:px-4 py-2 sm:h-10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 shrink-0 select-none">
        {/* Left: Metadata info */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <span className="shrink-0 font-semibold text-slate-700 dark:text-slate-200">Ngân hàng câu hỏi</span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
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
      <AttributeCatalogModal open={catalogModalOpen} onClose={() => setCatalogModalOpen(false)} />
      {/* Modal: Column Settings */}
      <Modal
        open={columnSettingsModalOpen}
        onClose={() => setColumnSettingsModalOpen(false)}
        title="Tùy chỉnh cột hiển thị trong bảng câu hỏi"
        size="lg"
        footer={<div className="flex flex-wrap w-full justify-between items-center gap-3">
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
              Xong
            </Button>
          </div>}
      >
        <div className="flex flex-col gap-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tích chọn các trường thông tin bạn muốn hiển thị trên trạm làm việc. Cài đặt được lưu tự động.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border border-slate-200/80 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 text-xs">
            {ALL_COLUMNS.map((col) => {
              const isChecked = visibleColumns.includes(col.id);
              const isLocked = col.id === 'content' || col.id === 'actions';
              return (
                <label
                  key={col.id}
                  className={`flex items-center gap-2 px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 select-none ${
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


        </div>
      </Modal>

      {/* Modal: Tạo thư mục mới */}
      <Modal
        open={createFolderModalOpen && !catalogModalOpen}
        onClose={() => setCreateFolderModalOpen(false)}
        title="Tạo thư mục câu hỏi mới"
        density="comfortable"
        size="lg"
        footer={<div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setCreateFolderModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit" form="create-question-folder">
              Tạo thư mục
            </Button>
          </div>}
      >
        <form id="create-question-folder" onSubmit={handleCreateFolder} className="flex flex-col gap-4 text-sm">
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
              {levelCatalog.label || 'Cấp độ áp dụng'}
            </label>
            <Select
              placeholder=""
              value={newFolderLevel}
              onChange={(e) => setNewFolderLevel(e.target.value)}
              disabled={levelCatalog.loading || !!levelCatalog.error}
              options={levelCatalog.optionsFor(newFolderLevel)}
            />
            <button type="button" onClick={() => setCatalogModalOpen(true)} className="mt-2 inline-flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400 hover:underline"><Settings size={14} />Quản lý thuộc tính và giá trị</button>
            {levelCatalog.error && <p role="alert" className="mt-1 text-sm text-rose-600">{levelCatalog.error}</p>}
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
          footer={<div className="flex justify-end gap-2 pt-2">
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
            </div>}
        >
          <div className="flex flex-col gap-3 text-xs text-slate-800 dark:text-slate-200">
            {/* Meta info header */}
            <div className="flex items-center gap-3 flex-wrap p-3 rounded-md bg-slate-50/60 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <div>
                Cấp độ:{' '}
                <strong className="text-blue-700 dark:text-blue-400">
                  {levelCatalog.labelFor(previewQuestion.level)}
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
            <div className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed whitespace-pre-wrap break-words select-text">
              {previewQuestion.content}
            </div>

            {/* If question has interactive HMI simulation */}
            {previewQuestion.format === 'simulation_hmi' && (
              <div className="mt-1">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
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
                <div className="font-semibold text-slate-700 dark:text-slate-300">Các lựa chọn:</div>
                {previewQuestion.options.map((opt, oIdx) => (
                  <div
                    key={opt.id || oIdx}
                    className={`p-2.5 rounded-md border flex items-center justify-between text-xs transition-colors ${
                      opt.isCorrect
                        ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 dark:border-emerald-700 text-slate-900 dark:text-slate-100'
                        : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{opt.text}</span>
                    {opt.isCorrect && (
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-[11px]">
                        Đáp án đúng
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {previewQuestion.explanation && (
              <div className="p-3 rounded-md bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/40 text-slate-700 dark:text-slate-200 leading-relaxed text-xs">
                <strong className="text-emerald-700 dark:text-emerald-400">Giải thích chi tiết: </strong>
                {previewQuestion.explanation}
              </div>
            )}

            {/* Actions in Modal */}

          </div>
        </Modal>
      )}
    </ManagementFrame>
  );
}
