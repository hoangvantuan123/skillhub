import React, { useState, useEffect } from 'react';
import { Menu, Bell, CircleHelp, X, CheckCheck, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../shared/hooks/useAuth';
import RoleSwitcher from '../../shared/components/RoleSwitcher';
import { mockApi } from '../../mocks/mockService';
import { formatDate } from '../../shared/lib/formatters';

export default function Topbar({ onOpenMenu, onOpenHelp }) {
  const { currentUser, switchRole } = useAuth();
  const [popover, setPopover] = useState(null); // 'notifications' | 'profile' | null
  const [notifications, setNotifications] = useState([]);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('skillhub_theme') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('skillhub_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    mockApi.getNotifications().then((res) => setNotifications(res.data || []));
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    const res = await mockApi.markAllNotificationsAsRead();
    setNotifications(res.data);
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="mobile-toggle icon-button"
          aria-label="Mở menu"
          onClick={onOpenMenu}
        >
          <Menu size={22} />
        </button>
        <span className="mobile-wordmark">SkillHub</span>
      </div>

      <div className="topbar-right">
        {/* Dark/Light mode switcher */}
        <button
          className="icon-button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Chuyển sang nền Sáng' : 'Chuyển sang nền Tối'}
          title={theme === 'dark' ? 'Giao diện Tối (Bấm để đổi sang Sáng)' : 'Giao diện Sáng (Bấm để đổi sang Tối)'}
          style={{ width: '36px', height: '36px', borderRadius: '10px' }}
        >
          {theme === 'dark' ? (
            <Sun size={19} className="text-amber-400" />
          ) : (
            <Moon size={19} className="text-slate-600" />
          )}
        </button>

        {/* Language selector */}
        <span className="language" title="Tiếng Việt (Asia/Ho_Chi_Minh)" aria-label="Ngôn ngữ Tiếng Việt" style={{ fontSize: '20px', cursor: 'default' }}>
          🇻🇳
        </span>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            className={`icon-button ${popover === 'notifications' ? 'selected' : ''}`}
            aria-label="Thông báo"
            aria-expanded={popover === 'notifications'}
            onClick={() => setPopover(popover === 'notifications' ? null : 'notifications')}
          >
            <Bell size={19} strokeWidth={1.7} />
            {unreadCount > 0 && <span className="icon-badge" />}
          </button>

          {popover === 'notifications' && (
            <div className="popover" style={{ width: '360px' }}>
              <div className="popover-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong>Thông báo</strong>
                  {unreadCount > 0 && (
                    <span style={{ fontSize: '11px', background: '#fee2e2', color: '#991b1b', padding: '1px 6px', borderRadius: '999px', fontWeight: '700' }}>
                      {unreadCount} mới
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      style={{ fontSize: '12px', color: 'var(--color-primary-600)', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 6px' }}
                      title="Đánh dấu tất cả đã đọc"
                    >
                      <CheckCheck size={14} /> Đã đọc
                    </button>
                  )}
                  <button className="icon-button" style={{ width: '28px', height: '28px' }} onClick={() => setPopover(null)}>
                    <X size={15} />
                  </button>
                </div>
              </div>

              <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notifications.length === 0 ? (
                  <p style={{ color: 'var(--navy-muted)', textAlign: 'center', padding: '20px 0', fontSize: '13px' }}>
                    Bạn chưa có thông báo nào.
                  </p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: n.read ? 'var(--surface-subtle)' : 'var(--color-primary-50)',
                        borderLeft: n.read ? '3px solid transparent' : '3px solid var(--color-primary-600)',
                        fontSize: '12px',
                      }}
                    >
                      <div style={{ fontWeight: '600', color: 'var(--navy)', marginBottom: '3px' }}>{n.title}</div>
                      <div style={{ color: 'var(--navy-muted)', lineHeight: '1.4' }}>{n.message}</div>
                      <small style={{ color: '#94a3b8', marginTop: '4px', display: 'block' }}>{n.time}</small>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Role Switcher Popover */}
        <div style={{ position: 'relative' }}>
          <button
            className="profile-button"
            aria-expanded={popover === 'profile'}
            onClick={() => setPopover(popover === 'profile' ? null : 'profile')}
          >
            <span className="avatar">{currentUser?.avatar || 'U'}</span>
            <span className="profile-text">
              <strong>{currentUser?.name || 'Tài khoản'}</strong>
              <small>{currentUser?.roleName} · {currentUser?.unit}</small>
            </span>
          </button>

          {popover === 'profile' && (
            <div className="popover" style={{ width: '320px' }}>
              <div className="popover-header">
                <div>
                  <strong>{currentUser?.name}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--navy-muted)' }}>{currentUser?.email}</div>
                </div>
                <button className="icon-button" style={{ width: '28px', height: '28px' }} onClick={() => setPopover(null)}>
                  <X size={15} />
                </button>
              </div>

              <div style={{ marginBottom: '14px', padding: '8px 12px', background: 'var(--surface-subtle)', borderRadius: '8px', fontSize: '12px' }}>
                <div><strong>Đơn vị:</strong> {currentUser?.department}</div>
                <div><strong>Phạm vi:</strong> {currentUser?.unit}</div>
              </div>

              <RoleSwitcher
                currentUserId={currentUser?.id}
                onSwitchRole={(id) => {
                  switchRole(id);
                  setPopover(null);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
