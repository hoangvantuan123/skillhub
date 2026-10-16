import React from 'react';
import SearchInput from './SearchInput';
import Select from './Select';
import FilterToggleMenu from './FilterToggleMenu';

export default function TableFilters({ fields, data, filters, onChange, search, onSearchChange, placeholder = 'Tìm kiếm…', formatCell = (column, row) => String(row[column.id] ?? '') }) {
  return <>
    <div className="w-full sm:w-72"><SearchInput size="sm" value={search} onChange={event => onSearchChange(event.target.value)} onClear={() => onSearchChange('')} placeholder={placeholder} /></div>
    {fields.filter(field => field.id !== 'actions' && Object.hasOwn(filters, field.id)).map(field => {
      const values = [...new Set(data.map(row => formatCell(field, row)))].filter(Boolean);
      const categorical = !['name', 'title', 'content', 'description', 'email'].includes(field.id) && values.length <= 40;
      return categorical ? <Select key={field.id} className="w-full sm:w-52" size="sm" placeholder={`Tất cả ${field.label}`} options={values.map(value => ({ value, label: value }))} value={filters[field.id]} onChange={event => onChange({ ...filters, [field.id]: event.target.value })} /> : <input key={field.id} aria-label={`Lọc ${field.label}`} className="h-8 w-full sm:w-52 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs" placeholder={`Lọc ${field.label}…`} value={filters[field.id]} onChange={event => onChange({ ...filters, [field.id]: event.target.value })} />;
    })}
    <FilterToggleMenu columns={fields.filter(field => field.id !== 'actions')} filters={filters} onToggle={key => { const next = { ...filters }; if (Object.hasOwn(next, key)) delete next[key]; else next[key] = ''; onChange(next); }} />
  </>;
}
