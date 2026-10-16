import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'linear-gradient(135deg, #0d1b2e 0%, #183760 50%, #2044bc 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        color: '#ffffff',
      }}
    >
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <Link to="/app" style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              width: '46px',
              height: '46px',
              background: '#ffffff',
              color: '#2044bc',
              borderRadius: '14px 14px 14px 4px',
              display: 'grid',
              placeItems: 'center',
              fontSize: '28px',
              fontWeight: '900',
              fontStyle: 'italic',
              transform: 'rotate(-6deg)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            }}
          >
            S
          </span>
          <span style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff' }}>
            SkillHub
          </span>
        </Link>
        <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '14px', marginTop: '8px' }}>
          Học tập · Tra cứu · Luyện tập · Đánh giá Năng lực
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: '440px' }}>
        <Outlet />
      </div>

      <div style={{ marginTop: '32px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
        SkillHub Architecture MVP · Phiên bản 2026
      </div>
    </div>
  );
}
