import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

/**
 * Standardized Custom Dropdown / Select Component
 * Quy chuẩn thiết kế chung cho toàn bộ hệ thống SkillHub:
 * - Thay thế hoàn toàn thẻ select mặc định của trình duyệt
 * - Hỗ trợ bảng dropdown list nổi, bo góc tròn, đổ bóng hiện đại
 * - Danh sách cuộn mượt mà với thanh cuộn tinh tế (scrollbar-thin)
 * - Tự động phát hiện vị trí (mở lên trên khi ở đáy màn hình hoặc mở xuống dưới)
 * - Tìm kiếm nhanh (khi danh sách nhiều hơn 7 mục hoặc searchable=true)
 * - Tích hợp Checkmark, Badge, Icon, Dark Mode và tương thích 100% với onChange(e)
 */
export default function Select({
  label,
  error,
  icon: Icon,
  options = [],
  value,
  onChange,
  placeholder = 'Chọn một tùy chọn...',
  disabled = false,
  className = '',
  size = 'md', // 'sm' | 'md' | 'lg'
  name,
  searchable = false,
  placement = 'auto', // 'auto' | 'top' | 'bottom'
  clearable = false,
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openUpward, setOpenUpward] = useState(false);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize options array
  const normalizedOptions = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'object' && opt !== null) {
        return {
          value: opt.value,
          label: opt.label !== undefined ? opt.label : String(opt.value),
          badge: opt.badge,
          icon: opt.icon,
          disabled: opt.disabled,
        };
      }
      return {
        value: opt,
        label: String(opt),
      };
    });
  }, [options]);

  // Find currently selected option
  const currentOption = useMemo(() => {
    return normalizedOptions.find(
      (opt) => String(opt.value) === String(value)
    );
  }, [normalizedOptions, value]);

  // Filter options by search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase();
    return normalizedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(q)
    );
  }, [normalizedOptions, searchQuery]);

  // Determine if search input should be visible
  const showSearch = searchable || normalizedOptions.length > 8;

  // Auto detect direction (up/down) when opening
  useEffect(() => {
    if (isOpen && containerRef.current) {
      if (placement === 'top') {
        setOpenUpward(true);
      } else if (placement === 'bottom') {
        setOpenUpward(false);
      } else {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        if (spaceBelow < 230 && spaceAbove > spaceBelow) {
          setOpenUpward(true);
        } else {
          setOpenUpward(false);
        }
      }

      // Auto focus search input if present
      if (showSearch) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 60);
      }
    } else {
      setSearchQuery('');
    }
  }, [isOpen, placement, showSearch]);

  // Close on click outside and escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Handle item selection with synthetic event support
  const handleSelect = (optVal) => {
    if (onChange) {
      const syntheticEvent = {
        target: { value: optVal, name },
        currentTarget: { value: optVal, name },
        preventDefault: () => {},
        stopPropagation: () => {},
      };
      onChange(syntheticEvent, optVal);
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    handleSelect('');
  };

  // Size styling tokens
  const sizeStyles = {
    sm: 'h-8 text-xs px-2.5',
    md: 'h-9 text-xs px-3',
    lg: 'h-10 text-sm px-3.5',
  };

  const hasValue = value !== '' && value !== null && value !== undefined;

  return (
    <div className={`relative flex flex-col gap-1 ${className}`} ref={containerRef}>
      {label && (
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 select-none">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 rounded-lg border font-medium transition-all select-none text-left cursor-pointer ${
          sizeStyles[size] || sizeStyles.md
        } ${
          disabled
            ? 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            : isOpen
            ? 'bg-white dark:bg-slate-900 border-emerald-600 dark:border-emerald-500 ring-2 ring-emerald-500/15 text-slate-900 dark:text-white shadow-xs'
            : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600'
        } ${error ? 'border-rose-500 focus:border-rose-500 ring-2 ring-rose-500/15' : ''}`}
        {...props}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
          {Icon && (
            <Icon
              size={size === 'sm' ? 13 : 15}
              className={`shrink-0 ${
                isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
              }`}
            />
          )}

          {currentOption ? (
            <span className="truncate text-slate-900 dark:text-slate-100">
              {currentOption.label}
            </span>
          ) : (
            <span className="truncate text-slate-400 dark:text-slate-500">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          {clearable && hasValue && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Xóa lựa chọn"
            >
              <X size={12} />
            </span>
          )}
          <ChevronDown
            size={size === 'sm' ? 13 : 15}
            className={`transition-transform duration-200 ${
              isOpen
                ? 'rotate-180 text-emerald-600 dark:text-emerald-400'
                : 'text-slate-400 dark:text-slate-500'
            }`}
          />
        </div>
      </button>

      {/* Standardized Dropdown Menu Panel ("chỗ đổ danh sách xuống") */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute left-0 w-full min-w-[200px] z-[99999] bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-slate-900/15 dark:shadow-black/70 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150 ${
            openUpward ? 'bottom-full mb-1.5 origin-bottom' : 'top-full mt-1.5 origin-top'
          }`}
        >
          {/* Quick Search inside dropdown if list is long */}
          {showSearch && (
            <div className="p-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40">
              <div className="relative flex items-center">
                <Search size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm tùy chọn..."
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Scrollable List Container ("danh sách cuộn") */}
          <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5 text-xs [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
            {/* Top Reset / All option if placeholder is configured */}
            {placeholder && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between text-left transition-colors cursor-pointer ${
                  !hasValue
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <span className="truncate">{placeholder}</span>
                {!hasValue && (
                  <Check size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0 ml-2" />
                )}
              </button>
            )}

            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-slate-400 text-xs">
                Không tìm thấy tùy chọn nào
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => !opt.disabled && handleSelect(opt.value)}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between text-left transition-colors cursor-pointer ${
                      opt.disabled
                        ? 'opacity-40 cursor-not-allowed text-slate-400'
                        : isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200/60 dark:border-emerald-800/40 shadow-2xs'
                        : 'text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-100/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2 min-w-0">
                      {opt.icon && (
                        <opt.icon
                          size={14}
                          className={`shrink-0 ${
                            isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                          }`}
                        />
                      )}
                      <span className="truncate">{opt.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {opt.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check
                          size={13}
                          className="text-emerald-600 dark:text-emerald-400"
                        />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && <span className="text-[11px] font-medium text-rose-600">{error}</span>}
    </div>
  );
}
