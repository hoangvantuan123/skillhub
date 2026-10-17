import React from 'react';

export default function Input({
  label,
  density = 'default',
  error,
  icon: Icon,
  className = '',
  style = {},
  id,
  ...props
}) {
  const generatedId = React.useId();
  const inputId = id || generatedId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...style }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: density === 'comfortable' ? '14px' : '13px',
            fontWeight: '600',
            color: 'var(--navy)',
          }}
        >
          {label}
        </label>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'var(--surface-card)',
          border: `1px solid ${error ? '#ef4444' : 'var(--line)'}`,
          borderRadius: '8px',
          padding: '0 12px',
          height: '40px',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          color: 'var(--navy-muted)',
        }}
      >
        {Icon && <Icon size={18} strokeWidth={1.8} />}
        <input className={className}
          id={inputId}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'var(--navy)',
            fontSize: density === 'comfortable' ? '14px' : '13px',
            width: '100%',
          }}
          {...props}
        />
      </div>
      {error && <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '500' }}>{error}</span>}
    </div>
  );
}


