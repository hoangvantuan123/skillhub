import React, { useEffect, useState } from 'react';
import { authService } from '../../services/auth/auth.service';

const deviceLabel = agent => {
  const browser = /Edg\//.test(agent) ? 'Edge' : /Firefox\//.test(agent) ? 'Firefox' : /Chrome\//.test(agent) ? 'Chrome' : /Safari\//.test(agent) ? 'Safari' : 'Trình duyệt khác';
  const system = /Android/.test(agent) ? 'Android' : /iPhone|iPad/.test(agent) ? 'iOS' : /Windows/.test(agent) ? 'Windows' : /Macintosh/.test(agent) ? 'macOS' : /Linux/.test(agent) ? 'Linux' : '';
  return [browser, system].filter(Boolean).join(' · ');
};
export default function AccountLoginHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    authService.history().then(data => { if (active) setHistory(data.history || []); })
      .catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);
  return <section aria-label="Lịch sử đăng nhập" className="text-xs">
    <div className="flex items-center justify-between mb-3"><h3 className="font-semibold">Lịch sử đăng nhập</h3><button disabled={loading} className="text-emerald-700 dark:text-emerald-400 disabled:opacity-50" onClick={() => setReload(n => n + 1)}>Làm mới</button></div>
    {loading ? <p role="status" className="py-4 text-slate-500">Đang tải lịch sử…</p> : error ? <p role="alert" className="text-red-600 py-3">{error}</p> : !history.length ? <p className="text-slate-500 py-3">Chưa có lịch sử đăng nhập.</p> : <ol className="max-h-64 overflow-auto divide-y divide-slate-100 dark:divide-slate-800">{history.map((event, index) => <li key={`${event.created_at}-${index}`} className="py-3 space-y-1.5">
      <div className="flex justify-between gap-3"><time>{new Date(event.created_at).toLocaleString('vi-VN')}</time><span className={event.success ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600'}>{event.success ? 'Thành công' : 'Không thành công'}</span></div>
      <div className="text-slate-500">IP: <span className="font-mono">{event.ip}</span></div>
      <details className="text-slate-500 leading-5"><summary className="cursor-pointer">{deviceLabel(event.user_agent || '')}</summary><p className="break-words mt-1 text-[11px]">{event.user_agent || 'Không rõ trình duyệt'}</p></details>
    </li>)}</ol>}
    <p className="mt-3 text-[11px] leading-5 text-slate-500">Chỉ hiển thị hoạt động của tài khoản hiện tại. Một tài khoản có thể có nhiều lần đăng nhập.</p>
  </section>;
}

