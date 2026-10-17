import React from 'react';

export default function Badge({
  children,
  variant = 'default', // 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  size = 'sm',
  style = {},
  className = '',
}) {
  const variants = {
    default: {
      background: 'var(--surface-subtle)',
      color: 'var(--navy-muted)',
      border: '1px solid var(--line)',
    },
    success: {
      background: 'var(--color-success-bg)',
      color: 'var(--color-success-text)',
      border: '1px solid var(--color-success-border)',
    },
    warning: {
      background: 'var(--color-warning-bg)',
      color: 'var(--color-warning-text)',
      border: '1px solid var(--color-warning-border)',
    },
    danger: {
      background: 'var(--color-danger-bg)',
      color: 'var(--color-danger-text)',
      border: '1px solid var(--color-danger-border)',
    },
    info: {
      background: 'var(--color-info-bg)',
      color: 'var(--color-info-text)',
      border: '1px solid var(--color-info-border)',
    },
    purple: {
      background: 'var(--color-purple-bg)',
      color: 'var(--color-purple-text)',
      border: '1px solid var(--color-purple-border)',
    },
  };

  const sizes = {
    sm: { padding: '3px 8px', fontSize: '11px', borderRadius: '6px' },
    md: { padding: '5px 12px', fontSize: '12px', borderRadius: '8px' },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontWeight: '600',
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
        ...sizes[size],
        ...variants[variant],
        ...style,
      }}
      className={`ui-badge ${className}`}
    >
      {children}
    </span>
  );
}
