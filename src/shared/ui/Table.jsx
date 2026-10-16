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
    <div className={`w-full overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>
      <table className="w-full border-collapse text-left text-xs text-slate-800">
        <thead>
          <tr className={`border-b border-slate-200 bg-slate-50/80 ${headerClassName}`}>
            {columns.map((col, idx) => (
              <th
                key={col.key || col.id || idx}
                className={`font-semibold text-slate-700 tracking-wide select-none ${
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
        <tbody className="divide-y divide-slate-100">
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
                } ${index % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'} ${rowClassName}`}
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
