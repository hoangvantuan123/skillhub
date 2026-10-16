import React from 'react';
import { mockUsers } from '../../mocks/mockData';
import { Check } from 'lucide-react';

export default function RoleSwitcher({ currentUserId, onSwitchRole, onClose }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--navy-muted)', padding: '4px 8px' }}>
        Chuyển đổi vai trò thử nghiệm
      </div>
      {mockUsers.map((user) => {
        const isSelected = user.id === currentUserId;
        return (
          <button
            key={user.id}
            onClick={() => {
              onSwitchRole(user.id);
              if (onClose) onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: '8px',
              background: isSelected ? 'var(--color-primary-50)' : 'transparent',
              color: 'var(--navy)',
              border: isSelected ? '1px solid var(--color-primary-200)' : '1px solid transparent',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: isSelected ? 'var(--color-primary-600)' : '#94a3b8',
                  color: '#ffffff',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '12px',
                  fontWeight: '700',
                }}
              >
                {user.avatar}
              </span>
              <div>
                <strong style={{ display: 'block', fontSize: '13px', lineHeight: 1.2 }}>{user.name}</strong>
                <small style={{ color: 'var(--navy-muted)', fontSize: '11px' }}>{user.roleName} · {user.unit}</small>
              </div>
            </div>
            {isSelected && <Check size={16} color="var(--color-primary-600)" strokeWidth={2.5} />}
          </button>
        );
      })}
    </div>
  );
}
