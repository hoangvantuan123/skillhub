import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * Unified SearchInput Component styled with Tailwind CSS
 * Chuẩn hóa ô tìm kiếm dùng chung cho toàn bộ dự án
 */
export default function SearchInput({
  value = '',
  onChange,
  onClear,
  placeholder = 'Tìm kiếm dữ liệu...',
  className = '',
  size = 'md', // 'sm' | 'md'
  disabled = false,
  ...props
}) {
  const sizeStyles = {
    sm: 'h-8 text-xs py-1 pl-8 pr-7',
    md: 'h-9 text-xs py-1.5 pl-8 pr-7',
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } });
    }
  };

  return (
    <div className={`relative inline-flex items-center w-full ${className}`}>
      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
        <Search size={14} />
      </div>

      <input
        type="text"
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-normal text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus:border-emerald-600 dark:focus:border-emerald-500 focus:outline-none disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-400 ${
          sizeStyles[size] || sizeStyles.md
        }`}
        {...props}
      />

      {value && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-4 h-4 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          title="Xóa nội dung"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
