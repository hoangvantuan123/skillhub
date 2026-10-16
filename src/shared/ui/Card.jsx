import React from 'react';

export default function Card({
  children,
  className = '',
  style = {},
  hoverable = false,
  padding = '20px',
  onClick,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--line)',
        borderRadius: '6px',
        boxShadow: 'none',
        padding,
        transition: hoverable ? 'border-color 0.18s ease' : 'none',
        cursor: onClick || hoverable ? 'pointer' : 'default',
        position: 'relative',
        ...style,
      }}
      className={`ui-card ${hoverable ? 'hoverable' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
