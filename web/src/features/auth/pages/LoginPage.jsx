import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useToast } from '../../../shared/hooks/useToast';
import LoadingPage from '../../../shared/ui/LoadingPage';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [registering, setRegistering] = useState(false);
  const [name, setName] = useState('');
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Submit standard login form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!email.trim()) {
      setErrorMsg('Vui lòng nhập tên tài khoản!');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Vui lòng nhập Mật khẩu!');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (registering) await register(name.trim(), email.trim(), password, rememberMe); else await login(email.trim(), password, rememberMe);
      navigate('/app', { replace: true });
    } catch (error) {
      setErrorMsg(error.message || 'Không thể đăng nhập. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-0 transition-colors" aria-busy={loading}>
      {loading && <LoadingPage fullScreen message="Đang đăng nhập…" />}
      <div className="mb-7 text-center lg:hidden">
        <img src="/assets/goldsun/goldsun-logo-col.png" alt="Goldsun Packaging" className="mx-auto mb-4 h-auto w-20 object-contain" />
        <p className="text-base font-semibold text-slate-900 dark:text-slate-100">Học tập & đánh giá năng lực</p>
        <p className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400">Goldsun Packaging · MES</p>
      </div>
      <div className="mb-6 sm:mb-8 text-left">
        <p className="hidden lg:block mb-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">CHÀO MỪNG TRỞ LẠI</p>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{registering ? "Đăng ký tài khoản" : "Đăng nhập"}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Đăng nhập hoặc tạo tài khoản để vào học.</p>
      </div>
      {/* Main Single Login Form - Comfortable Form Density (40px inputs, 14px font) */}
      <button type="button" className="mb-5 text-emerald-700" onClick={() => { setRegistering(!registering); setErrorMsg(''); }}>{registering ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}</button>
      <form onSubmit={handleSubmit} className="space-y-5">
        {registering && <label className="block text-sm">Họ và tên<input required minLength={2} maxLength={120} autoComplete="name" value={name} onChange={e => setName(e.target.value)} className="mt-2 w-full h-11 px-3 border rounded-md dark:bg-slate-900" /></label>}
        {/* Username / Email field */}
        <div>
          <label htmlFor="login-account" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
            Tên tài khoản
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500 pointer-events-none">
              <Mail size={16} />
            </span>
            <input
              id="login-account" type="text"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập tên tài khoản, ví dụ: tuanhoang"
              className="w-full h-11 sm:h-10 pl-9 pr-3 text-base sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
            />
          </div>
        </div>

        {/* Password field */}
        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
            Mật khẩu
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-slate-500 pointer-events-none">
              <Lock size={16} />
            </span>
            <input
              id="login-password" type={showPassword ? 'text' : 'password'}
              required
              minLength={registering ? 12 : undefined} maxLength={72} autoComplete={registering ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              className="w-full h-11 sm:h-10 pl-9 pr-10 text-base sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
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
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs pt-0.5">
          <label className="min-h-11 flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
            />
            <span>Ghi nhớ đăng nhập</span>
          </label>

          <button
            type="button"
            onClick={() => addToast('Vui lòng liên hệ Quản trị viên Khối CNTT Goldsun Packaging để cấp lại mật khẩu.', 'info', 4500)}
            className="min-h-11 flex items-center text-emerald-700 dark:text-emerald-400 hover:underline font-medium"
          >
            Quên mật khẩu?
          </button>
        </div>

        {/* Error notification banner */}
        {errorMsg && (
          <div role="alert" className="p-2.5 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <ShieldAlert size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 sm:h-10 mt-1 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <span>Đang xác thực...</span>
          ) : (
            <>
              <span>{registering ? "Tạo tài khoản học viên" : "Đăng nhập hệ thống"}</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>


    </div>
  );
}


