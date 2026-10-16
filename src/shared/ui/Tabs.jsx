import React from 'react';

export default function Tabs({
  tabs = [],
  activeTab,
  onChange,
  className = '',
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        borderBottom: '1px solid var(--line)',
        paddingBottom: '2px',
        marginBottom: '20px',
        overflowX: 'auto',
      }}
      className={`ui-tabs ${className}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: isActive ? '700' : '500',
              color: isActive ? 'var(--color-primary-600)' : 'var(--navy-muted)',
              borderBottom: isActive ? '2px solid var(--color-primary-600)' : '2px solid transparent',
              background: 'transparent',
              borderRadius: '6px 6px 0 0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.icon && <tab.icon size={16} />}
            <span>{tab.label}</span>
            {tab.count != null && (
              <span
                style={{
                  background: isActive ? 'var(--color-primary-50)' : 'var(--surface-subtle)',
                  color: isActive ? 'var(--color-primary-600)' : 'var(--navy-muted)',
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '2px 7px',
                  borderRadius: '999px',
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
