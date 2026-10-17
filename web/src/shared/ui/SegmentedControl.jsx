import React from 'react';

/**
 * Unified SegmentedControl Component styled with Tailwind CSS
 * Bộ điều khiển chuyển đổi tab / chế độ xem chuẩn hóa
 */
export default function SegmentedControl({
  options = [],
  value,
  onChange,
  size = 'md', // 'sm' | 'md'
  className = '',
}) {
  const sizeStyles = {
    sm: 'p-0.5 text-xs',
    md: 'p-1 text-xs',
  };

  const itemSizeStyles = {
    sm: 'px-2.5 py-1',
    md: 'px-3 py-1.5',
  };

  return (
    <div
      className={`inline-flex items-center rounded-lg border border-slate-200 bg-slate-100/80 select-none ${
        sizeStyles[size] || sizeStyles.md
      } ${className}`}
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-1.5 rounded-md font-medium transition-all ${
              itemSizeStyles[size] || itemSizeStyles.md
            } ${
              isSelected
                ? 'bg-white text-blue-700 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            {Icon && <Icon size={14} className={isSelected ? 'text-blue-600' : 'text-slate-400'} />}
            <span>{opt.label}</span>
            {opt.badge !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isSelected ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
