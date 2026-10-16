import React from 'react';
import { Search } from 'lucide-react';
import Input from '../ui/Input';

export default function SearchFilter({
  searchValue,
  onSearchChange,
  placeholder = 'Tìm kiếm...',
  filters = null,
  actions = null,
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        background: '#ffffff',
        padding: '14px 18px',
        borderRadius: '12px',
        border: '1px solid var(--line)',
        marginBottom: '20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px' }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
          <Input
            icon={Search}
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        {filters}
      </div>

      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {actions}
        </div>
      )}
    </div>
  );
}
