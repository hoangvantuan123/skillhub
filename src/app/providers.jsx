import React, { createContext, useState, useEffect } from 'react';
import { mockUsers } from '../mocks/mockData';
import { storage } from '../shared/lib/storage';

export const AuthContext = createContext(null);
export const ToastContext = createContext(null);
export const NetworkContext = createContext({ isOnline: true });

export function Providers({ children }) {
  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = useState(() => {
    const savedId = storage.get('current_user_id', 'u-1');
    return mockUsers.find((u) => u.id === savedId) || mockUsers[0];
  });

  const switchRole = (userId) => {
    const target = mockUsers.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      storage.set('current_user_id', target.id);
      addToast(`Đã chuyển vai trò sang: ${target.roleName}`, 'info');
    }
  };

  const hasPermission = (permission) => {
    if (!currentUser) return false;
    if (currentUser.permissions?.includes('admin:all')) return true;
    return currentUser.permissions?.includes(permission);
  };

  // --- TOAST STATE ---
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // --- NETWORK STATE ---
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      addToast('Đã khôi phục kết nối mạng.', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      addToast('Mất kết nối mạng! Các câu trả lời sẽ được lưu tạm tại máy.', 'warning', 6000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ isOnline }}>
      <AuthContext.Provider value={{ currentUser, switchRole, hasPermission }}>
        <ToastContext.Provider value={{ addToast }}>
          {children}

          {/* Toast Container */}
          <div
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              pointerEvents: 'none',
            }}
          >
            {toasts.map((toast) => {
              const bgColors = {
                success: '#059669',
                warning: '#d97706',
                danger: '#dc2626',
                info: '#2044bc',
              };
              return (
                <div
                  key={toast.id}
                  style={{
                    background: bgColors[toast.type] || '#10294b',
                    color: '#ffffff',
                    padding: '12px 18px',
                    borderRadius: '10px',
                    boxShadow: 'var(--shadow-lg)',
                    fontSize: '13px',
                    fontWeight: '600',
                    maxWidth: '380px',
                    pointerEvents: 'auto',
                    animation: 'fadeIn 0.2s ease-out',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                  onClick={() => removeToast(toast.id)}
                >
                  <span>{toast.message}</span>
                  <button
                    style={{ color: '#ffffff', opacity: 0.8, background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                    onClick={() => removeToast(toast.id)}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </ToastContext.Provider>
      </AuthContext.Provider>
    </NetworkContext.Provider>
  );
}
