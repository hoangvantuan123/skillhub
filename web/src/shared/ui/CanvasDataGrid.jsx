import { useTablePreferences } from '../lib/tablePreferences';
import React, { useRef, useMemo, useCallback, useState, useEffect } from 'react';
import DataEditor, { GridCellKind } from '@glideapps/glide-data-grid';
import '@glideapps/glide-data-grid/dist/index.css';

export default function CanvasDataGrid({
  columns = [],
  rows = [],
  onRowClick,
  onFolderClick,
  isFolderView = false,
  rowHeight: overrideRowHeight,
  headerHeight = 38,
  customTheme = {},
}) {
  const { rowHeight: defaultRowHeight } = useTablePreferences();
  const rowHeight = overrideRowHeight ?? defaultRowHeight;
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 600 });
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  // Dynamically observe document theme class changes
  useEffect(() => {
    const handleMutation = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    const observer = new MutationObserver(handleMutation);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  // Dynamically observe container size to auto-fit viewport
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth || 1200,
          height: containerRef.current.clientHeight || 600,
        });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Map columns to Glide Data Grid GridColumn format
  const gridColumns = useMemo(() => {
    return columns.map((col) => ({
      id: col.id,
      title: col.label || col.title,
      width: parseInt(col.width, 10) || 160,
    }));
  }, [columns]);

  // Color mappings for canvas text rendering
  const getCellColor = useCallback((field, val, row) => {
    if (field === 'isCritical') {
      return row.isCritical ? '#f87171' : (isDark ? '#64748b' : '#94a3b8');
    }
    if (field === 'level') {
      const colors = { L0: '#f87171', L1: '#fb923c', L2: '#60a5fa', L3: '#34d399' };
      return colors[row.level] || (isDark ? '#94a3b8' : '#64748b');
    }
    if (field === 'status') {
      const colors = { published: '#34d399', pending_review: '#fbbf24', draft: '#94a3b8' };
      return colors[row.status] || (isDark ? '#94a3b8' : '#64748b');
    }
    if (field === 'format') {
      if (row.format === 'simulation_hmi') return '#38bdf8';
      if (row.format === 'case_study') return '#c084fc';
      if (row.format === 'critical_safety') return '#f87171';
      return isDark ? '#cbd5e1' : '#334155';
    }
    if (field === 'name' && isFolderView) {
      return isDark ? '#60a5fa' : '#1d4ed8'; // Folder blue
    }
    return isDark ? '#f8fafc' : '#0f172a';
  }, [isFolderView, isDark]);

  // Format cell display text
  const getCellText = useCallback((field, row) => {
    if (!row) return '';
    if (field === 'isCritical') {
      return row.isCritical ? 'Điểm liệt' : '-';
    }
    if (field === 'level') {
      return row.level ? `Level ${row.level.replace('L', '')}` : 'Chung';
    }
    if (field === 'format') {
      switch (row.format) {
        case 'simulation_hmi': return 'Mô phỏng HMI';
        case 'case_study': return 'Tình huống';
        case 'critical_safety': return 'An toàn';
        case 'essay': return 'Tự luận';
        default: return 'Trắc nghiệm';
      }
    }
    if (field === 'status') {
      switch (row.status) {
        case 'published': return 'Đã xuất bản';
        case 'pending_review': return 'Chờ duyệt';
        case 'draft': return 'Bản nháp';
        default: return row.status || '-';
      }
    }
    if (field === 'questionCount') {
      return `${(row.questionCount || 0).toLocaleString('vi-VN')} câu hỏi`;
    }
    if (field === 'criticalCount') {
      return row.criticalCount > 0 ? `${row.criticalCount} câu điểm liệt` : '-';
    }
    if (field === 'name') {
      return isFolderView ? `📁 ${row.name || ''}` : (row.content || row.name || '');
    }
    if (field === 'content') {
      return row.content || '';
    }
    if (field === 'id') {
      return `#${row.id || ''}`;
    }
    if (field === 'actions') {
      return isFolderView ? 'Mở >' : 'Xem >';
    }
    return String(row[field] || '-');
  }, [isFolderView]);

  // Canvas Cell Content Callback - Direct HTML5 Canvas drawing, 0 DOM nodes
  const getCellContent = useCallback(
    ([colIdx, rowIdx]) => {
      const col = gridColumns[colIdx];
      const row = rows[rowIdx];
      if (!col || !row) {
        return {
          kind: GridCellKind.Text,
          allowOverlay: false,
          data: '',
          displayData: '',
        };
      }

      const text = getCellText(col.id, row);
      const textColor = getCellColor(col.id, text, row);
      const isAltRow = rowIdx % 2 === 1;

      return {
        kind: GridCellKind.Text,
        allowOverlay: false,
        data: text,
        displayData: text,
        themeOverride: {
          textDark: textColor,
          bgCell: isDark
            ? isAltRow ? '#0b1324' : '#020617'
            : isAltRow ? '#f8fafc' : '#ffffff',
          accentColor: '#10b981',
        },
      };
    },
    [gridColumns, rows, getCellText, getCellColor, isDark]
  );

  // Cell Click Handler
  const onCellClicked = useCallback(
    ([colIdx, rowIdx]) => {
      const row = rows[rowIdx];
      if (!row) return;
      if (isFolderView) {
        if (onFolderClick) onFolderClick(row);
      } else {
        if (onRowClick) onRowClick(row);
      }
    },
    [rows, isFolderView, onFolderClick, onRowClick]
  );

  // Default theme merged with user's customTheme
  const theme = useMemo(() => {
    if (isDark) {
      return {
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        baseFontStyle: '13px',
        headerFontStyle: '600 13px',
        accentColor: '#3b82f6',
        accentLight: '#1e3a8a',
        textDark: '#f8fafc',
        textMedium: '#cbd5e1',
        textLight: '#94a3b8',
        bgCell: '#020617',
        bgCellMedium: '#0b1324',
        bgHeader: '#0b1120',
        bgHeaderHasFocus: '#1e293b',
        bgHeaderHovered: '#1e293b',
        borderColor: '#1e293b',
        ...customTheme,
      };
    }
    return {
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      baseFontStyle: '13px',
      headerFontStyle: '600 13px',
      accentColor: '#2563eb',
      accentLight: '#eff6ff',
      textDark: '#0f172a',
      textMedium: '#475569',
      textLight: '#94a3b8',
      bgCell: '#ffffff',
      bgHeader: '#ffffff',
      bgHeaderHasFocus: '#f1f5f9',
      bgHeaderHovered: '#f8fafc',
      borderColor: '#e2e8f0',
      ...customTheme,
    };
  }, [isDark, customTheme]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden bg-white dark:bg-slate-950 select-none"
      style={{ minHeight: '300px' }}
    >
      <DataEditor
        width={dimensions.width}
        height={dimensions.height}
        columns={gridColumns}
        rows={rows.length}
        getCellContent={getCellContent}
        onCellClicked={onCellClicked}
        rowHeight={rowHeight}
        headerHeight={headerHeight}
        smoothScrollX
        smoothScrollY
        isDraggable={false}
        theme={theme}
      />
    </div>
  );
}
