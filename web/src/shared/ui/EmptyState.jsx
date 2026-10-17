import React from 'react';
import { FolderOpen } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  icon: Icon = FolderOpen,
  title = 'Không có dữ liệu',
  description = 'Chưa có thông tin hoặc bộ lọc không tìm thấy kết quả phù hợp.',
  actionLabel,
  onAction,
}) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '50px 20px',
        maxWidth: '480px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'var(--color-primary-50)',
          color: 'var(--color-primary-600)',
          display: 'grid',
          placeItems: 'center',
          marginBottom: '18px',
          boxShadow: 'inset 0 0 0 1px var(--color-primary-100)',
        }}
      >
        <Icon size={30} strokeWidth={1.5} />
      </div>
      <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--navy)', marginBottom: '8px' }}>
        {title}
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--navy-muted)', lineHeight: '1.6', marginBottom: actionLabel ? '20px' : '0' }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
