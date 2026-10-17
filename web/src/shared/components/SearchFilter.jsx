import React from 'react';
import SearchInput from '../ui/SearchInput';

export default function SearchFilter({ searchValue, onSearchChange, placeholder = 'Tìm kiếm…', filters = null, actions = null }) {
  return <div className="flex w-full flex-wrap items-center justify-between gap-2">
    <div className="flex flex-1 flex-wrap items-center gap-2 min-w-0">
      <div className="w-full sm:w-72"><SearchInput size="sm" placeholder={placeholder} value={searchValue} onChange={event => onSearchChange(event.target.value)} onClear={() => onSearchChange('')} /></div>
      {filters}
    </div>
    {actions && <div className="management-actions">{actions}</div>}
  </div>;
}
