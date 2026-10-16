import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  X,
  Sun,
  Moon,
  Bell,
  CircleHelp,
  CheckCheck,
  LogOut,
} from 'lucide-react';
import { navigation } from '../../app/navigation';
import { useAuth } from '../../shared/hooks/useAuth';
import RoleSwitcher from '../../shared/components/RoleSwitcher';
import { mockApi } from '../../mocks/mockService';

export default function Sidebar({ open, onClose, onOpenHelp }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, switchRole, logout } = useAuth();

  // Popover state: null | 'notifications' | 'profile'
  const [popover, setPopover] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Floating tooltip for desktop collapsed rail
  const [hoveredTooltip, setHoveredTooltip] = useState(null);

  const showTooltip = (label, e) => {
    if (window.innerWidth <= 768) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredTooltip({
      label,
      top: rect.top + rect.height / 2,
    });
  };

  const hideTooltip = () => {
    setHoveredTooltip(null);
  };

  // Theme toggle state (syncs with localStorage & class dark on html)
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
    setNotifications(res.data || []);
  };

  // Filter navigation items based on current role
  const visibleItems = navigation.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.includes(currentUser?.role);
  });

  const mainItems = visibleItems.filter((i) => !i.isBottom);
  const bottomItems = visibleItems.filter((i) => i.isBottom);

  return (
    <>
      {/* Mobile scrim / backdrop */}
      <button
        className={`scrim ${open ? 'visible' : ''}`}
        aria-label="Đóng menu"
        onClick={onClose}
      />

      {/* Popover backdrop click-away */}
      {popover && (
        <div
          className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[0.5px]"
          onClick={() => setPopover(null)}
        />
      )}

      <aside className={`sidebar ${open ? 'open' : ''}`} onMouseLeave={hideTooltip}>
        {/* Brand / Logo */}
        <Link
          to="/app"
          className="brand"
          aria-label="Đánh giá năng lực MES - Trang chủ"
          onClick={() => { hideTooltip(); onClose?.(); }}
          onMouseEnter={(e) => showTooltip('Đánh giá năng lực MES - Trang chủ', e)}
          onMouseLeave={hideTooltip}
        >
          <img
            src="/assets/goldsun/goldsun-icon.png"
            alt="Goldsun"
            className="w-7 h-7 object-contain rounded"
          />
          <span className="mobile-wordmark font-bold tracking-wider" style={{ marginLeft: '10px', color: '#ffffff' }}>MES Goldsun</span>
        </Link>

        <button className="mobile-close icon-button" onClick={onClose} aria-label="Đóng menu">
          <X size={18} />
        </button>

        {/* Main Navigation Items (Compact Rail) */}
        <nav aria-label="Điều hướng chính">
          {mainItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/app' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => { hideTooltip(); onClose?.(); }}
                onMouseEnter={(e) => showTooltip(item.label, e)}
                onMouseLeave={hideTooltip}
              >
                <Icon size={15} strokeWidth={isActive ? 2 : 1.6} />
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Utility Controls (Integrated Header utilities) */}
        <div className="sidebar-bottom-controls">
          {/* Settings link if present */}
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`sidebar-util-btn ${isActive ? 'active' : ''}`}
                aria-label={item.label}
                onClick={() => { hideTooltip(); onClose?.(); }}
                onMouseEnter={(e) => showTooltip(item.label, e)}
                onMouseLeave={hideTooltip}
              >
                <Icon size={15} strokeWidth={isActive ? 2 : 1.6} />
                <span className="mobile-only-label">{item.label}</span>
              </Link>
            );
          })}

          {/* Theme switcher */}
          <button
            className="sidebar-util-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Chuyển sang nền Sáng' : 'Chuyển sang nền Tối'}
            onMouseEnter={(e) => showTooltip(theme === 'dark' ? 'Chuyển sang nền Sáng' : 'Chuyển sang nền Tối', e)}
            onMouseLeave={hideTooltip}
          >
            {theme === 'dark' ? (
              <Sun size={15} className="text-amber-400" />
            ) : (
              <Moon size={15} className="text-white/80" />
            )}
            <span className="mobile-only-label">
              {theme === 'dark' ? 'Giao diện Sáng' : 'Giao diện Tối'}
            </span>
          </button>

          {/* Notifications */}
          <button
            className={`sidebar-util-btn relative ${popover === 'notifications' ? 'active' : ''}`}
            aria-label="Thông báo"
            onClick={() => { hideTooltip(); setPopover(popover === 'notifications' ? null : 'notifications'); }}
            onMouseEnter={(e) => showTooltip('Thông báo hệ thống', e)}
            onMouseLeave={hideTooltip}
          >
            <Bell size={15} strokeWidth={1.6} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 border border-[#025c27]" />
            )}
            <span className="mobile-only-label">
              Thông báo {unreadCount > 0 ? `(${unreadCount})` : ''}
            </span>
          </button>

          {/* Help button */}
          {onOpenHelp && (
            <button
              className="sidebar-util-btn"
              onClick={() => {
                hideTooltip();
                onOpenHelp();
                onClose?.();
              }}
              aria-label="Trợ giúp"
              onMouseEnter={(e) => showTooltip('Trợ giúp & Hướng dẫn', e)}
              onMouseLeave={hideTooltip}
            >
              <CircleHelp size={15} strokeWidth={1.6} />
              <span className="mobile-only-label">Trợ giúp</span>
            </button>
          )}

          {/* User Profile Avatar & Role Switcher */}
          <div className="relative mt-1">
            <button
              className={`sidebar-avatar-btn ${popover === 'profile' ? 'active-avatar' : ''}`}
              aria-label="Tài khoản & Vai trò"
              onClick={() => { hideTooltip(); setPopover(popover === 'profile' ? null : 'profile'); }}
              onMouseEnter={(e) => showTooltip(`${currentUser?.name || 'Tài khoản'} (${currentUser?.roleName || 'Vai trò'})`, e)}
              onMouseLeave={hideTooltip}
            >
              <span className="avatar-circle">{currentUser?.avatar || 'U'}</span>
            </button>
          </div>
        </div>

        {/* Global Floating Tooltip for Desktop Rail */}
        {hoveredTooltip && !popover && (
          <div
            className="sidebar-floating-tooltip"
            style={{ top: `${hoveredTooltip.top}px` }}
            role="tooltip"
          >
            {hoveredTooltip.label}
          </div>
        )}

        {/* Notifications Popover (Floats to the right of sidebar) */}
        {popover === 'notifications' && (
          <div
            className="fixed z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 text-slate-800 dark:text-slate-100"
            style={{
              left: '74px',
              bottom: '50px',
              width: '350px',
              maxHeight: '440px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-2">
              <div className="flex items-center gap-2">
                <strong className="text-sm font-bold text-slate-900 dark:text-white">Thông báo</strong>
                {unreadCount > 0 && (
                  <span className="text-[11px] bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full font-bold">
                    {unreadCount} mới
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1 px-1.5 py-0.5"
                    title="Đánh dấu tất cả đã đọc"
                  >
                    <CheckCheck size={14} /> Đã đọc
                  </button>
                )}
                <button
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  onClick={() => setPopover(null)}
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 flex flex-col gap-2 max-h-[300px] pr-1">
              {notifications.length === 0 ? (
                <p className="text-slate-400 dark:text-slate-500 text-center py-6 text-xs">
                  Bạn chưa có thông báo nào.
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-xl text-xs transition-colors ${
                      n.read
                        ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400'
                        : 'bg-emerald-50/70 dark:bg-emerald-950/30 text-slate-800 dark:text-slate-200 border-l-2 border-emerald-600'
                    }`}
                  >
                    <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{n.title}</div>
                    <div className="text-slate-600 dark:text-slate-300 line-clamp-2">{n.message}</div>
                    <small className="text-slate-400 dark:text-slate-500 mt-1 block">{n.time}</small>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* User Profile & Role Switcher Popover (Floats to the right of sidebar) */}
        {popover === 'profile' && (
          <div
            className="fixed z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 text-slate-800 dark:text-slate-100"
            style={{
              left: '74px',
              bottom: '12px',
              width: '320px',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold flex items-center justify-center text-xs shadow-md">
                  {currentUser?.avatar || 'U'}
                </div>
                <div>
                  <strong className="text-sm font-bold text-slate-900 dark:text-white block leading-tight">
                    {currentUser?.name || 'Tài khoản'}
                  </strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {currentUser?.email || 'user@skillhub.vn'}
                  </span>
                </div>
              </div>
              <button
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                onClick={() => setPopover(null)}
              >
                <X size={15} />
              </button>
            </div>

            <div className="mb-3 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Vai trò hiện tại:</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">{currentUser?.roleName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Đơn vị:</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{currentUser?.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Phạm vi:</span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{currentUser?.unit}</span>
              </div>
            </div>

            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Chuyển đổi vai trò làm việc
            </div>
            <RoleSwitcher
              currentUserId={currentUser?.id}
              onSwitchRole={(id) => {
                switchRole(id);
                setPopover(null);
              }}
            />

            <button
              type="button"
              onClick={() => {
                setPopover(null);
                logout();
                navigate('/login');
              }}
              className="w-full mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 p-2 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              <span>Đăng xuất hệ thống</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
