import React from 'react';

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size = 'md',        // 'sm' | 'md' | 'lg'
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className = '',
  style = {},
  ...props
}) {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    borderRadius: '8px',
    fontWeight: '600',
    transition: 'all 0.15s ease',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? 0.6 : 1,
    border: '1px solid transparent',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };

  const sizes = {
    sm: { padding: '6px 12px', fontSize: '12px', height: '32px' },
    md: { padding: '9px 16px', fontSize: '13px', height: '38px' },
    lg: { padding: '12px 22px', fontSize: '15px', height: '46px' },
  };

  const variants = {
    primary: {
      background: 'var(--color-primary-600)',
      color: '#ffffff',
      boxShadow: '0 2px 4px rgba(32, 68, 188, 0.2)',
    },
    secondary: {
      background: 'var(--color-primary-50)',
      color: 'var(--color-primary-700)',
      border: '1px solid var(--color-primary-200)',
    },
    outline: {
      background: '#ffffff',
      color: 'var(--navy)',
      border: '1px solid var(--line)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--navy-muted)',
    },
    danger: {
      background: '#dc2626',
      color: '#ffffff',
      boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)',
    },
  };

  return (
    <button
      style={{
        ...baseStyles,
        ...sizes[size],
        ...variants[variant],
        ...style,
      }}
      disabled={disabled || loading}
      className={`ui-button ${className}`}
      {...props}
    >
      {loading ? (
        <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
      ) : (
        Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : 17} strokeWidth={2} />
      )}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : 17} strokeWidth={2} />}
    </button>
  );
}
