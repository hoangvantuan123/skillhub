import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../shared/ui/Card';
import Button from '../../../shared/ui/Button';
import { useAuth } from '../../../shared/hooks/useAuth';
import { mockUsers } from '../../../mocks/mockData';
import { ArrowRight, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { switchRole } = useAuth();

  const handleQuickLogin = (userId) => {
    switchRole(userId);
    navigate('/app');
  };

  return (
    <Card style={{ padding: '28px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--navy)', marginBottom: '6px' }}>
          Đăng nhập hệ thống
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--navy-muted)' }}>
          Chọn một tài khoản mẫu để trải nghiệm đầy đủ quyền hạn và quy trình:
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {mockUsers.map((user) => (
          <button
            key={user.id}
            onClick={() => handleQuickLogin(user.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: '10px',
              border: '1px solid var(--line)',
              background: 'var(--surface-canvas)',
              transition: 'all 0.15s ease',
              textAlign: 'left',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary-400)';
              e.currentTarget.style.background = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--line)';
              e.currentTarget.style.background = 'var(--surface-canvas)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--color-primary-600)',
                  color: '#ffffff',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: '700',
                  fontSize: '14px',
                }}
              >
                {user.avatar}
              </span>
              <div>
                <strong style={{ fontSize: '13px', color: 'var(--navy)', display: 'block' }}>
                  {user.name}
                </strong>
                <span style={{ fontSize: '11px', color: 'var(--color-primary-700)', fontWeight: '600' }}>
                  {user.roleName}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--navy-muted)', marginLeft: '6px' }}>
                  · {user.department}
                </span>
              </div>
            </div>

            <ArrowRight size={17} color="var(--navy-muted)" />
          </button>
        ))}
      </div>

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/app')}>
          Vào trang tổng quan ngay →
        </Button>
      </div>
    </Card>
  );
}
