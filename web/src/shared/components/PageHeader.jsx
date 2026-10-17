import React from 'react';

export default function PageHeader({
  title,
  subtitle,
  badge,
  actions,
  backAction,
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px',
      }}
    >
      <div>
        {backAction && (
          <div style={{ marginBottom: '8px' }}>
            {backAction}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--navy)', letterSpacing: '-0.02em' }}>
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p style={{ fontSize: '13px', color: 'var(--navy-muted)', marginTop: '4px', maxWidth: '680px' }}>
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {actions}
        </div>
      )}
    </div>
  );
}
