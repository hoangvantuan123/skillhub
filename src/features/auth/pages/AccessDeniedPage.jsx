import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../shared/ui/Card';
import Button from '../../../shared/ui/Button';
import { ShieldAlert } from 'lucide-react';

export default function AccessDeniedPage() {
  const navigate = useNavigate();

  return (
    <Card style={{ padding: '36px 24px', textAlign: 'center' }}>
      <div
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '20px',
          background: 'var(--color-danger-bg)',
          color: '#dc2626',
          display: 'grid',
          placeItems: 'center',
          margin: '0 auto 18px',
        }}
      >
        <ShieldAlert size={32} />
      </div>
      <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--navy)', marginBottom: '8px' }}>
        Từ chối truy cập (403)
      </h2>
      <p style={{ fontSize: '13px', color: 'var(--navy-muted)', lineHeight: '1.6', marginBottom: '24px' }}>
        Tài khoản của bạn hiện tại chưa được cấp quyền truy cập hoặc phạm vi tài nguyên này không thuộc đơn vị quản lý của bạn.
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <Button variant="secondary" onClick={() => navigate('/login')}>
          Đổi tài khoản
        </Button>
        <Button variant="primary" onClick={() => navigate('/app')}>
          Về trang tổng quan
        </Button>
      </div>
    </Card>
  );
}
