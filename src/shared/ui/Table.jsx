import React from 'react';

/**
 * Reusable Modern Table Component styled with Tailwind CSS
 * Dễ dàng tùy biến trực tiếp qua className, columns[i].render, hoặc props
 */
export default function Table({
  columns = [],
  data = [],
  keyField = 'id',
  emptyText = 'Không có dữ liệu',
  onRowClick,
  className = '',
  headerClassName = '',
  rowClassName = '',
  compact = false,
}) {
  return (
    <div className={`w-full overflow-x-auto border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 ${className}`}>
      <table className="w-full border-collapse text-left text-xs text-slate-800 dark:text-slate-200">
        <thead className="sticky top-0 z-10">
          <tr className={`border-b border-slate-200 bg-slate-100 dark:bg-slate-900 ${headerClassName}`}>
            {columns.map((col, idx) => (
              <th
                key={col.key || col.id || idx}
                className={`font-semibold text-slate-600 dark:text-slate-300 tracking-wide select-none ${
                  compact ? 'px-3 py-2 text-[11px]' : 'px-4 py-3 text-xs'
                }`}
                style={{
                  width: col.width,
                  minWidth: col.minWidth,
                  textAlign: col.align || 'left',
                }}
              >
                {col.title || col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-10 px-4 text-center text-slate-400 font-medium"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={row[keyField] || row.id || index}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors ${
                  onRowClick ? 'cursor-pointer hover:bg-slate-50/80 active:bg-blue-50/40' : 'hover:bg-slate-50/40'
                } ${index % 2 === 1 ? 'bg-slate-50/30 dark:bg-slate-900/30' : 'bg-white dark:bg-slate-950'} ${rowClassName}`}
              >
                {columns.map((col, cIdx) => (
                  <td
                    key={col.key || col.id || cIdx}
                    className={`${compact ? 'px-3 py-2' : 'px-4 py-3'} leading-relaxed`}
                    style={{
                      textAlign: col.align || 'left',
                    }}
                  >
                    {col.render
                      ? col.render(row[col.key || col.id], row, index)
                      : row[col.key || col.id]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
