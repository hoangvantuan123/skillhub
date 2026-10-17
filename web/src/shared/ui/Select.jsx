import { filterSelectOptions } from '../lib/searchOptions';
import React, { useState, useRef, useEffect, useMemo, useLayoutEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search, X } from 'lucide-react';

/**
 * Standardized Custom Dropdown / Select Component
 * Quy chuẩn thiết kế chung cho toàn bộ hệ thống SkillHub:
 * - Thay thế hoàn toàn thẻ select mặc định của trình duyệt
 * - Hỗ trợ bảng dropdown list nổi, bo góc tròn, đổ bóng hiện đại
 * - Danh sách cuộn mượt mà với thanh cuộn tinh tế (scrollbar-thin)
 * - Tự động phát hiện vị trí (mở lên trên khi ở đáy màn hình hoặc mở xuống dưới)
 * - Luôn có tìm kiếm ở đầu danh sách, hỗ trợ tiếng Việt không dấu
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
  searchable = true,
  placement = 'auto', // 'auto' | 'top' | 'bottom'
  clearable = false,
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuStyle, setMenuStyle] = useState({});
  const menuRef = useRef(null);
  const triggerRef = useRef(null);
  const listId = useId();
  const [activeIndex, setActiveIndex] = useState(-1);
  const closeMenu = () => { setIsOpen(false); triggerRef.current?.focus(); };

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize options array
  const normalizedOptions = useMemo(() => {
    const items = options.map((opt) => {
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
    if ((clearable || placeholder.startsWith('Tất cả')) && !items.some(option => String(option.value) === '')) items.unshift({ value: '', label: placeholder.startsWith('Tất cả') ? placeholder : 'Bỏ lựa chọn' });
    return items;
  }, [options, clearable, placeholder]);

  // Find currently selected option
  const currentOption = useMemo(() => {
    return normalizedOptions.find(
      (opt) => String(opt.value) === String(value)
    );
  }, [normalizedOptions, value]);

  // Filter options by search query
  const filteredOptions = useMemo(() => {
    return filterSelectOptions(normalizedOptions, searchQuery);
  }, [normalizedOptions, searchQuery]);

  // Kept for caller compatibility; search is mandatory for all option lists.
  const showSearch = true;
  useEffect(() => {
    const selected = filteredOptions.findIndex(option => !option.disabled && String(option.value) === String(value));
    setActiveIndex(selected >= 0 ? selected : filteredOptions.findIndex(option => !option.disabled));
  }, [filteredOptions, value, isOpen]);
  useEffect(() => { if (isOpen && activeIndex >= 0) menuRef.current?.querySelector('[data-option-index="' + activeIndex + '"]')?.scrollIntoView({ block: 'nearest' }); }, [activeIndex, isOpen]);
  const handleMenuKey = event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeMenu(); return; }
    if (event.key === 'Tab') { setIsOpen(false); triggerRef.current?.focus(); return; }
    const enabled = filteredOptions.map((option, index) => option.disabled ? -1 : index).filter(index => index >= 0);
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const position = enabled.indexOf(activeIndex);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? enabled.length - 1 : event.key === 'ArrowDown' ? (position + 1) % enabled.length : (position <= 0 ? enabled.length : position) - 1;
      setActiveIndex(enabled[next] ?? -1);
    } else if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault();
      const option = filteredOptions[activeIndex];
      if (option && !option.disabled) handleSelect(option.value);
    }
  };

  // Fixed positioning avoids clipping in modal/toolbar scroll containers.
  useLayoutEffect(() => {
    if (!isOpen) { setSearchQuery(''); return; }
    const position = () => {
      const button = containerRef.current?.querySelector('button');
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom - 12;
      const above = rect.top - 12;
      const upward = placement === 'top' || (placement !== 'bottom' && below < 240 && above > below);
      const width = Math.min(Math.max(rect.width, 200), window.innerWidth - 24);
      setMenuStyle({
        position: 'fixed', width, left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
        top: upward ? undefined : rect.bottom + 6,
        bottom: upward ? window.innerHeight - rect.top + 6 : undefined,
        maxHeight: Math.max(0, upward ? above : below),
      });
    };
    position();
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    const frame = requestAnimationFrame(() => { if (showSearch) searchInputRef.current?.focus(); });
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', position); window.removeEventListener('scroll', position, true); };
  }, [isOpen, placement, showSearch]);

  // Close on click outside and escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target) && !menuRef.current?.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeMenu();
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
    triggerRef.current?.focus();
  };

  const handleClear = (e) => {
    e.stopPropagation();
    handleSelect('');
  };

  // Size styling tokens
  const sizeStyles = {
    sm: 'min-h-8 text-xs px-2.5 py-1',
    md: 'min-h-9 text-xs px-3 py-1.5',
    lg: 'min-h-10 text-sm px-3.5 py-2',
  };

  const hasValue = value !== '' && value !== null && value !== undefined;

  return (
    <div className={`relative flex flex-col gap-1 ${className}`} ref={containerRef}>
      {label && (
        <label className={`${size === 'lg' ? 'text-sm' : 'text-xs'} font-medium text-slate-700 dark:text-slate-300 select-none`}>
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-label={props['aria-label'] || label || placeholder}
        aria-controls={isOpen ? listId : undefined}
        onKeyDown={event => { if (['ArrowDown', 'ArrowUp'].includes(event.key) && !disabled) { event.preventDefault(); setIsOpen(true); } }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 rounded-lg border font-medium transition-all select-none text-left cursor-pointer ${
          sizeStyles[size] || sizeStyles.md
        } ${
          disabled
            ? 'bg-slate-100 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            : isOpen
            ? 'bg-white dark:bg-slate-900 border-emerald-600 dark:border-emerald-500 ring-0 text-slate-900 dark:text-white'
            : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600'
        } ${error ? 'border-rose-500 focus:border-rose-500 ring-2 ring-rose-500/15' : ''}`}
        {...props}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {Icon && (
            <Icon
              size={size === 'sm' ? 13 : 15}
              className={`shrink-0 ${
                isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
              }`}
            />
          )}

          {currentOption ? (
            <span className="whitespace-normal break-words text-slate-900 dark:text-slate-100">
              {currentOption.label}
            </span>
          ) : (
            <span className="whitespace-normal break-words text-slate-400 dark:text-slate-500">
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
      {isOpen && createPortal(
        <div
          ref={menuRef}
          style={menuStyle}
          onKeyDown={handleMenuKey}
          className="z-[100001] flex flex-col bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-none overflow-hidden"
        >
          {/* Always-visible search, separate from the scrollable options. */}
          {showSearch && (
            <div className="shrink-0 px-2 py-1.5">
              <div className="relative flex items-center">
                <Search size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  role="combobox"
                  aria-label="Tìm kiếm trong danh sách"
                  aria-autocomplete="list"
                  aria-expanded={isOpen}
                  aria-controls={listId}
                  aria-activedescendant={activeIndex >= 0 ? listId + '-option-' + activeIndex : undefined}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm tùy chọn..."
                  className="w-full h-8 pl-8 pr-8 text-xs rounded-md border-0 bg-transparent text-slate-800 dark:text-slate-100 outline-none focus-visible:ring-1 focus-visible:ring-emerald-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Xóa từ khóa tìm kiếm" onClick={() => { setSearchQuery(''); searchInputRef.current?.focus(); }}
                    className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Scrollable List Container ("danh sách cuộn") */}
          <div id={listId} role="listbox" aria-label={label || placeholder} className="min-h-0 max-h-72 overflow-y-auto p-1.5 space-y-0.5 text-xs [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-200 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">
            {filteredOptions.length === 0 ? (
              <div role="status" className="py-4 text-center text-slate-400 text-xs">
                Không tìm thấy tùy chọn nào
              </div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    id={listId + '-option-' + index}
                    role="option"
                    aria-selected={String(opt.value) === String(value)}
                    aria-disabled={!!opt.disabled}
                    data-option-index={index}
                    tabIndex={-1}
                    onMouseEnter={() => { if (!opt.disabled) setActiveIndex(index); }}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => !opt.disabled && handleSelect(opt.value)}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between text-left transition-colors cursor-pointer ${
                      opt.disabled
                        ? 'opacity-40 cursor-not-allowed text-slate-400'
                        : isSelected
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                        : 'text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-100/70 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    } ${index === activeIndex && !opt.disabled ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
                  >
                    <div className="flex items-center gap-2 pr-2 min-w-0">
                      {opt.icon && (
                        <opt.icon
                          size={14}
                          className={`shrink-0 ${
                            isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                          }`}
                        />
                      )}
                      <span className="whitespace-normal break-words">{opt.label}</span>
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
        </div>,
        containerRef.current?.closest('[role="dialog"]') || document.body
      )}

      {error && <span className="text-[11px] font-medium text-rose-600">{error}</span>}
    </div>
  );
}

