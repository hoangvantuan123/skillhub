import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockApi } from '../../../mocks/mockService';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useToast } from '../../../shared/hooks/useToast';
import { ShieldAlert, ArrowRight, Sparkles, ClipboardCheck } from 'lucide-react';

export default function CandidateExamLoginPage() {
  const navigate = useNavigate();
  const { switchRole } = useAuth();
  const { addToast } = useToast();

  const [sbd, setSbd] = useState('tuan.hm@skillhub.vn');
  const [passcode, setPasscode] = useState('PASS-8001');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFillDemo = (sampleSbd, samplePass) => {
    setSbd(sampleSbd);
    setPasscode(samplePass);
    setErrorMsg('');
  };

  const handleLoginExam = async (e) => {
    e?.preventDefault();
    if (!sbd.trim()) {
      setErrorMsg('Vui lòng nhập Số Báo Danh (SBD) hoặc Email thí sinh!');
      return;
    }
    if (!passcode.trim()) {
      setErrorMsg('Vui lòng nhập Mã bảo mật phòng thi (Passcode)!');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await mockApi.verifyCandidatePasscode(sbd, passcode);
      const { user, examTitle } = res.data;

      // Log in candidate
      await mockApi.switchRole(user.id);
      switchRole(user.id);
      addToast(`Xác thực thành công! Đang vào ${examTitle}`, 'success');

      // Navigate to candidate exams
      navigate('/app/exams');
    } catch (err) {
      setErrorMsg(err.message || 'Mã đăng nhập hoặc Số Báo Danh không hợp lệ!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm overflow-hidden p-6 sm:p-7">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-11 h-11 rounded-lg bg-emerald-600 text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
          <ClipboardCheck size={22} strokeWidth={2.2} />
        </div>
        <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">
          Cổng Vào Phòng Thi Đánh Giá
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          Dành cho thí sinh dự thi đánh giá chuẩn hóa năng lực MES & Kiến trúc hệ thống Goldsun Packaging.
        </p>
      </div>

      {/* Demo Fast-track Pill */}
      <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-md p-3 mb-5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-2">
          <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400" />
          <span>Thử nhanh thông tin thí sinh mẫu:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleFillDemo('tuan.hm@skillhub.vn', 'PASS-8001')}
            className="text-xs px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 font-medium transition-colors"
          >
            Kỹ sư Hoàng Minh Tuấn (Senior MES)
          </button>
          <button
            type="button"
            onClick={() => handleFillDemo('quan.tm@skillhub.vn', 'PASS-8891')}
            className="text-xs px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 font-medium transition-colors"
          >
            Kỹ sư Trần Minh Quân (Lead MES)
          </button>
        </div>
      </div>

      {/* Login Form - Comfortable Form Density (40px input, 14px text) */}
      <form onSubmit={handleLoginExam} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
            Số Báo Danh (SBD) hoặc Email thí sinh:
          </label>
          <input
            type="text"
            required
            value={sbd}
            onChange={(e) => setSbd(e.target.value)}
            placeholder="VD: SBD-MES-202601 hoặc email@goldsun.vn"
            className="w-full h-10 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
            Mã bảo mật phòng thi (Passcode):
          </label>
          <input
            type="password"
            required
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="VD: PASS-8001"
            className="w-full h-10 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors font-mono"
          />
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
            <ShieldAlert size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 mt-2 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-60"
        >
          {loading ? (
            <span>Đang xác thực phòng thi...</span>
          ) : (
            <>
              <span>Vào phòng thi ngay</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      {/* Footer info */}
      <div className="text-center border-t border-slate-200 dark:border-slate-800 pt-4 mt-6 text-xs text-slate-500 dark:text-slate-400">
        Hệ thống giám sát tự động snapshot bài thi · Yêu cầu kết nối mạng ổn định
      </div>
    </div>
  );
}
