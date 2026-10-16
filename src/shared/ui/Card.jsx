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
        background: '#ffffff',
        border: '1px solid var(--line)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-xs)',
        padding,
        transition: hoverable ? 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease' : 'none',
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
