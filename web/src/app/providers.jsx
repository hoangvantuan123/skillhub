import { setTablePreferenceUser } from '../shared/lib/tablePreferences';
import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/auth/auth.service';

import { GooeyToaster } from 'goey-toast';
import 'goey-toast/styles.css';
import { notify } from '../shared/lib/notify';

export const AuthContext = createContext(null);
export const ToastContext = createContext(null);
export const NetworkContext = createContext({ isOnline: true });

export function Providers({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  useEffect(() => { setTablePreferenceUser(currentUser?.id || currentUser?.user_id || currentUser?.username); }, [currentUser?.id, currentUser?.user_id, currentUser?.username]);
  useEffect(() => {
    let active = true;
    // Remove authentication leftovers from the former demo implementation.
    try { ['skillhub_current_user_id', 'skillhub_is_authenticated'].forEach(key => localStorage.removeItem(key)); } catch {}
    authService.refresh().then(data => { if (active) setCurrentUser(data.user); }).catch(() => {}).finally(() => { if (active) setAuthLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!currentUser) return;
    const timer = setInterval(() => authService.me().then(data => setCurrentUser(data.user)).catch(error => { if (error.status === 401) setCurrentUser(null); }), 60 * 1000);
    return () => clearInterval(timer);
  }, [currentUser]);
  const login = async (username, password, remember) => {
    const data = await authService.login(username, password, remember);
    setCurrentUser(data.user);
    return data.user;
  };
  const register = async (name, username, password, remember) => {
    const data = await authService.register(name, username, password, remember);
    setCurrentUser(data.user);
    return data.user;
  };
  const logout = async () => {
    try { await authService.logout(); setCurrentUser(null); }
    catch (e) { notify(e.message, 'error'); }
  };
  const switchRole = () => notify('Vai trò được quản lý bởi máy chủ.', 'info');
  const hasPermission = (permission) => {
    if (!currentUser) return false;
    if (currentUser.permissions?.includes('admin:all')) return true;
    return currentUser.permissions?.includes(permission);
  };

  const refreshUser = async () => { const data = await authService.me(); setCurrentUser(data.user); return data.user; };
  const addToast = notify;

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
      <AuthContext.Provider value={{ currentUser, authLoading, login, register, logout, switchRole, hasPermission, refreshUser }}>
        <ToastContext.Provider value={{ addToast }}>
          {children}

          <NotificationHost />
        </ToastContext.Provider>
      </AuthContext.Provider>
    </NetworkContext.Provider>
  );
}

function NotificationHost() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const observer = new MutationObserver(() => setDark(document.documentElement.classList.contains('dark')));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return <GooeyToaster position="top-right" theme={dark ? 'dark' : 'light'} closeButton="top-right" visibleToasts={3} maxQueue={5} queueOverflow="drop-oldest" preset="subtle" closeOnEscape swipeToDismiss showProgress showTimestamp={false} />;
}


