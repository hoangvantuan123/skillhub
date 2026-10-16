import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useToast } from '../../../shared/hooks/useToast';
import { mockUsers } from '../../../mocks/mockData';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();

  const [email, setEmail] = useState('tuan.hm@skillhub.vn');
  const [password, setPassword] = useState('Goldsun@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Submit standard login form
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('Vui lòng nhập Email hoặc Mã nhân viên!');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Vui lòng nhập Mật khẩu!');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      login(email.trim());
      setLoading(false);
      navigate('/app');
    }, 350);
  };

  // Quick 1-click login with sample role
  const handleQuickLogin = (userId) => {
    const selected = mockUsers.find((u) => u.id === userId);
    if (selected) {
      setEmail(selected.email);
      setPassword('Goldsun@2026');
      login(selected.id);
      navigate('/app');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm p-6 sm:p-7 transition-colors">
      {/* Brand Header inside Login Card */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 mx-auto mb-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center p-2 shadow-xs">
          <img
            src="/assets/goldsun/goldsun-icon.png"
            alt="Goldsun Packaging"
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Đăng Nhập Hệ Thống
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Đánh giá năng lực MES · Goldsun Packaging
        </p>
      </div>

      {/* Main Single Login Form - Comfortable Form Density (40px inputs, 14px font) */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username / Email field */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
            Tài khoản hoặc Email nhân viên
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500 pointer-events-none">
              <Mail size={16} />
            </span>
            <input
              type="text"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="VD: tuan.hm@skillhub.vn hoặc NV-MES-088"
              className="w-full h-10 pl-9 pr-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
            />
          </div>
        </div>

        {/* Password field */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
            Mật khẩu
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500 pointer-events-none">
              <Lock size={16} />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-10 pl-9 pr-10 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Remember me & Forgot password */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
            />
            <span>Ghi nhớ phiên làm việc</span>
          </label>

          <button
            type="button"
            onClick={() => addToast('Vui lòng liên hệ Quản trị viên Khối CNTT Goldsun Packaging để cấp lại mật khẩu.', 'info', 4500)}
            className="text-emerald-700 dark:text-emerald-400 hover:underline font-medium"
          >
            Quên mật khẩu?
          </button>
        </div>

        {/* Error notification banner */}
        {errorMsg && (
          <div className="p-2.5 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <ShieldAlert size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 mt-1 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <span>Đang xác thực...</span>
          ) : (
            <>
              <span>Đăng nhập hệ thống</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Quick Demo Roles Selection */}
      <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles size={13} className="text-emerald-600 dark:text-emerald-400" />
            Đăng nhập nhanh theo vai trò mẫu:
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            1-click
          </span>
        </div>

        <div className="grid grid-cols-1 gap-1.5">
          {mockUsers.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleQuickLogin(user.id)}
              className="w-full flex items-center justify-between px-3 py-2 text-left rounded-md border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-800 transition-colors group focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  {user.avatar}
                </div>
                <div className="min-w-0 truncate">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                    {user.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {user.roleName} · {user.department}
                  </div>
                </div>
              </div>
              <ArrowRight size={13} className="text-slate-400 group-hover:text-emerald-600 shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
