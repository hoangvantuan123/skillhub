import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../shared/ui/Button';
import Select from '../../../shared/ui/Select';
import {
  Sliders,
  Clock,
  Award,
  Layers,
  MapPin,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Save,
  Plus,
  ArrowLeft,
  Sparkles,
  Zap,
  Lock,
  Users,
} from 'lucide-react';
import { useToast } from '../../../shared/hooks/useToast';

/**
 * Cấu hình quy chuẩn Bộ đề thi & Đề luyện tập
 * Thiết lập số lượng câu hỏi, cơ cấu Level ISA-95, điểm đạt, thời gian và vị trí/địa điểm tổ chức thi.
 */
export default function ExamBlueprintConfigPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Mode: 'exam' (Thi sát hạch chính thức) | 'practice' (Tự luyện tập)
  const [configMode, setConfigMode] = useState('exam');

  // Question counts & level distribution
  const [totalQuestions, setTotalQuestions] = useState(40);
  const [l0Count, setL0Count] = useState(6);
  const [l1Count, setL1Count] = useState(14);
  const [l2Count, setL2Count] = useState(12);
  const [l3Count, setL3Count] = useState(8);
  const [criticalCount, setCriticalCount] = useState(3);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleChoices, setShuffleChoices] = useState(true);

  // Passing criteria
  const [passingPercentage, setPassingPercentage] = useState(75);
  const [strictCriticalRule, setStrictCriticalRule] = useState(true);
  const [hmiWeightMultiplier, setHmiWeightMultiplier] = useState('1.5');

  // Timing & proctoring
  const [durationMinutes, setDurationMinutes] = useState(configMode === 'exam' ? 45 : 30);
  const [autoSubmitOnTimeout, setAutoSubmitOnTimeout] = useState(true);
  const [tabSwitchLock, setTabSwitchLock] = useState(configMode === 'exam');
  const [minSubmitMinutes, setMinSubmitMinutes] = useState(15);

  // Location & Access Control
  const [location, setLocation] = useState('workshop-offset-1');
  const [ipSubnet, setIpSubnet] = useState('192.168.10.0/24');
  const [targetGroup, setTargetGroup] = useState('grp-mes');
  const [maxAttempts, setMaxAttempts] = useState(configMode === 'exam' ? 1 : 0);

  // Quick Preset Handlers
  const handleApplyPreset = (presetType) => {
    if (presetType === 'standard_40') {
      setTotalQuestions(40);
      setL0Count(6);
      setL1Count(14);
      setL2Count(12);
      setL3Count(8);
      setCriticalCount(3);
      setDurationMinutes(45);
      setPassingPercentage(75);
      addToast('Đã áp dụng mẫu quy chuẩn: Đề thi chuẩn ISA-95 (40 câu / 45 phút)', 'info');
    } else if (presetType === 'quick_20') {
      setTotalQuestions(20);
      setL0Count(3);
      setL1Count(7);
      setL2Count(6);
      setL3Count(4);
      setCriticalCount(2);
      setDurationMinutes(25);
      setPassingPercentage(70);
      addToast('Đã áp dụng mẫu quy chuẩn: Đề thi nhanh trạm làm việc (20 câu / 25 phút)', 'info');
    } else if (presetType === 'expert_60') {
      setTotalQuestions(60);
      setL0Count(10);
      setL1Count(20);
      setL2Count(18);
      setL3Count(12);
      setCriticalCount(5);
      setDurationMinutes(75);
      setPassingPercentage(80);
      addToast('Đã áp dụng mẫu quy chuẩn: Sát hạch Chuyên gia & Quản trị MES (60 câu / 75 phút)', 'info');
    }
  };

  const currentLevelTotal = Number(l0Count) + Number(l1Count) + Number(l2Count) + Number(l3Count);
  const isSumValid = currentLevelTotal === Number(totalQuestions);

  const handleSaveConfig = (e) => {
    e.preventDefault();
    if (!isSumValid) {
      alert(`Tổng số câu theo các cấp độ (${currentLevelTotal} câu) chưa khớp với Tổng số câu của đề (${totalQuestions} câu)!`);
      return;
    }

    // Save to localStorage or state
    const configData = {
      configMode,
      totalQuestions: Number(totalQuestions),
      distribution: { l0: Number(l0Count), l1: Number(l1Count), l2: Number(l2Count), l3: Number(l3Count) },
      criticalCount: Number(criticalCount),
      shuffleQuestions,
      shuffleChoices,
      passingPercentage: Number(passingPercentage),
      strictCriticalRule,
      durationMinutes: Number(durationMinutes),
      autoSubmitOnTimeout,
      tabSwitchLock,
      location,
      ipSubnet,
      targetGroup,
      maxAttempts: Number(maxAttempts),
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem(`skillhub_blueprint_${configMode}`, JSON.stringify(configData));
    addToast(`Đã lưu cấu hình quy chuẩn cho [${configMode === 'exam' ? 'Bộ đề thi chính thức' : 'Bộ đề tự luyện'}] thành công!`, 'success');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50/50 dark:bg-slate-950">
      {/* Top Bar Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 py-3 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/manage/assessments')}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Quay lại danh sách bộ đề"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-emerald-600 dark:text-emerald-400" />
                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  Cấu hình Quy chuẩn Bộ đề thi & Đề luyện
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  Ma trận ISA-95
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Thiết lập số lượng câu hỏi, điểm đạt, thời gian làm bài và vị trí/xưởng tổ chức thi chuẩn hóa.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={() => handleApplyPreset('standard_40')}
              className="!h-8 !text-xs"
            >
              Mặc định
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Save}
              onClick={handleSaveConfig}
              className="!h-8 !text-xs whitespace-nowrap"
            >
              Lưu cấu hình này
            </Button>
          </div>
        </div>

        {/* Tab Selection: Exam vs Practice Mode */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              setConfigMode('exam');
              setDurationMinutes(45);
              setMaxAttempts(1);
              setTabSwitchLock(true);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              configMode === 'exam'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Award size={14} />
            Đề thi Sát hạch Chính thức (Official Exam)
          </button>

          <button
            type="button"
            onClick={() => {
              setConfigMode('practice');
              setDurationMinutes(30);
              setMaxAttempts(0);
              setTabSwitchLock(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              configMode === 'practice'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Zap size={14} />
            Bộ đề Tự Luyện tập (Self-Practice Mode)
          </button>

          {/* Preset Buttons */}
          <div className="hidden lg:flex items-center gap-1.5 ml-auto text-xs text-slate-500">
            <span className="text-[11px] font-semibold">Mẫu nhanh:</span>
            <button
              type="button"
              onClick={() => handleApplyPreset('quick_20')}
              className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-[11px]"
            >
              20 câu (Nhanh)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('standard_40')}
              className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-[11px]"
            >
              40 câu (Chuẩn)
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('expert_60')}
              className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-[11px]"
            >
              60 câu (Chuyên sâu)
            </button>
          </div>
        </div>
      </div>

      {/* Main Configuration Content Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5">
        <form onSubmit={handleSaveConfig} className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Column 1 & 2: Detailed Parameters */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* 1. Số lượng câu hỏi & Cơ cấu phân bổ Level */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Số lượng câu hỏi & Ma trận ISA-95
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Quy định tổng số câu và phân bổ theo 4 cấp độ tự động hóa công nghiệp.
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-xs font-bold ${isSumValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {currentLevelTotal} / {totalQuestions} câu
                  </span>
                  <div className="text-[10px] text-slate-400">
                    {isSumValid ? '✓ Đã khớp số lượng' : '⚠️ Chưa khớp tổng'}
                  </div>
                </div>
              </div>

              {/* Total Questions Input */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Tổng số câu hỏi phát ra trong 1 đề thi <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="5"
                    max="150"
                    value={totalQuestions}
                    onChange={(e) => setTotalQuestions(e.target.value)}
                    className="w-32 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-bold focus:border-emerald-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-1.5">
                    {[20, 30, 40, 50, 60].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => {
                          setTotalQuestions(num);
                          const factor = num / 40;
                          setL0Count(Math.round(6 * factor));
                          setL1Count(Math.round(14 * factor));
                          setL2Count(Math.round(12 * factor));
                          setL3Count(num - Math.round(6 * factor) - Math.round(14 * factor) - Math.round(12 * factor));
                        }}
                        className={`px-2 py-1 rounded text-xs transition-colors ${
                          Number(totalQuestions) === num
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-300 font-bold'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {num} câu
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Level Breakdown Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {/* Level 0 */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      Level 0 — Thiết bị trường & Cảm biến
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {Math.round((l0Count / (totalQuestions || 1)) * 100)}%
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={l0Count}
                    onChange={(e) => setL0Count(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-bold"
                  />
                </div>

                {/* Level 1 */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                      Level 1 — PLC & Điều khiển máy
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {Math.round((l1Count / (totalQuestions || 1)) * 100)}%
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={l1Count}
                    onChange={(e) => setL1Count(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-bold"
                  />
                </div>

                {/* Level 2 */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      Level 2 — SCADA & Giao diện HMI
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {Math.round((l2Count / (totalQuestions || 1)) * 100)}%
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={l2Count}
                    onChange={(e) => setL2Count(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-bold"
                  />
                </div>

                {/* Level 3 */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                      Level 3 — MES / MOM & ERP Liên vận
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {Math.round((l3Count / (totalQuestions || 1)) * 100)}%
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={l3Count}
                    onChange={(e) => setL3Count(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              {/* Critical Questions & Shuffle */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={15} className="text-rose-600 shrink-0" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Số câu Điểm liệt bắt buộc trong đề:
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={criticalCount}
                    onChange={(e) => setCriticalCount(e.target.value)}
                    className="w-16 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold text-center"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={shuffleQuestions}
                      onChange={(e) => setShuffleQuestions(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Đảo thứ tự câu</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={shuffleChoices}
                      onChange={(e) => setShuffleChoices(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Đảo đáp án A-B-C-D</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 2. Tiêu chuẩn Điểm đạt & Xếp loại */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Tiêu chuẩn Điểm đạt & Điều kiện Đỗ
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Quy định ngưỡng phần trăm vượt qua và chế tài xử lý câu hỏi Điểm liệt.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Ngưỡng điểm đạt tối thiểu (Passing Score)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="50"
                      max="100"
                      value={passingPercentage}
                      onChange={(e) => setPassingPercentage(e.target.value)}
                      className="w-24 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-bold focus:border-emerald-500 focus:outline-none"
                    />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">% tổng điểm</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tương đương: <strong>{((passingPercentage / 100) * 10).toFixed(1)} / 10 điểm</strong>.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Hệ số điểm cho câu Mô phỏng HMI / SCADA
                  </label>
                  <Select
                    size="sm"
                    value={hmiWeightMultiplier}
                    onChange={(e) => setHmiWeightMultiplier(e.target.value)}
                    options={[
                      { value: '1.0', label: 'Hệ số 1.0 (Bằng câu lý thuyết thông thường)' },
                      { value: '1.5', label: 'Hệ số 1.5 (Ưu tiên năng lực thực hành HMI)' },
                      { value: '2.0', label: 'Hệ số 2.0 (Gấp đôi điểm lý thuyết)' },
                    ]}
                  />
                </div>
              </div>

              {/* Strict Critical Check */}
              <div className="mt-3.5 p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 text-xs">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={strictCriticalRule}
                    onChange={(e) => setStrictCriticalRule(e.target.checked)}
                    className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="font-bold text-rose-800 dark:text-rose-300">
                      Ràng buộc Điểm liệt tuyệt đối (Zero Tolerance)
                    </span>
                    <p className="text-[11px] text-rose-700/80 dark:text-rose-400/90 mt-0.5 leading-relaxed">
                      Học viên bắt buộc phải trả lời đúng 100% các câu hỏi Điểm liệt. Nếu sai dù chỉ 1 câu, hệ thống tự động ghi nhận kết quả <strong>KHÔNG ĐẠT (TRƯỢT)</strong> bất kể tổng điểm đạt bao nhiêu.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* 3. Thời gian làm bài & Quản lý thi */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Thời gian làm bài & Kiểm soát Giám thị
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Cài đặt đếm ngược, khóa chuyển tab và tự động nộp bài khi hết giờ.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Thời lượng làm bài (Duration) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="5"
                      max="240"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(e.target.value)}
                      className="w-24 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-bold focus:border-emerald-500 focus:outline-none"
                    />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Phút</span>
                    <div className="flex gap-1 ml-2">
                      {[15, 30, 45, 60, 90].map((mins) => (
                        <button
                          type="button"
                          key={mins}
                          onClick={() => setDurationMinutes(mins)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            Number(durationMinutes) === mins
                              ? 'bg-purple-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {mins}p
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Thời gian tối thiểu trước khi được nộp bài
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max={durationMinutes}
                      value={minSubmitMinutes}
                      onChange={(e) => setMinSubmitMinutes(e.target.value)}
                      className="w-24 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-bold focus:border-emerald-500 focus:outline-none"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400">Phút kể từ lúc bắt đầu</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={autoSubmitOnTimeout}
                    onChange={(e) => setAutoSubmitOnTimeout(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Tự động thu bài và chốt điểm khi đếm ngược về 00:00</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={tabSwitchLock}
                    onChange={(e) => setTabSwitchLock(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-400">
                    <Lock size={12} /> Bật chế độ chống gian lận & Khóa chuyển Tab
                  </span>
                </label>
              </div>
            </div>

            {/* 4. Vị trí / Địa điểm tổ chức & Trạm thi */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                  4
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Vị trí, Địa điểm & Phân quyền Trạm thi
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Giới hạn vị trí xưởng sản xuất, dải mạng IP nội bộ và nhóm nhân sự dự thi.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Vị trí xưởng / Phòng khảo thí
                  </label>
                  <Select
                    size="sm"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    options={[
                      { value: 'workshop-offset-1', label: 'Xưởng In Offset — Trạm HMI Máy 01' },
                      { value: 'workshop-smt-4', label: 'Xưởng Điện tử SMT — Dây chuyền Trộn 04' },
                      { value: 'lab-center-a', label: 'Phòng Khảo thí Trung tâm — Lab A' },
                      { value: 'factory-online', label: 'Toàn nhà máy (Thi trực tuyến có giám sát)' },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Giới hạn Dải IP trạm máy (IP Subnet Whitelist)
                  </label>
                  <input
                    type="text"
                    value={ipSubnet}
                    onChange={(e) => setIpSubnet(e.target.value)}
                    placeholder="192.168.10.0/24 hoặc để trống nếu cho phép tất cả"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Nhóm nhân sự / Học viên áp dụng
                  </label>
                  <Select
                    size="sm"
                    value={targetGroup}
                    onChange={(e) => setTargetGroup(e.target.value)}
                    options={[
                      { value: 'grp-mes', label: 'Nhóm Kỹ sư MES & Smart Factory' },
                      { value: 'grp-op', label: 'Tổ Vận hành viên Máy In & Trạm trộn' },
                      { value: 'grp-maint', label: 'Đội Bảo trì Cơ điện & Tự động hóa' },
                      { value: 'grp-all', label: 'Tất cả nhân sự đạt điều kiện ca thi' },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Số lượt thi tối đa cho phép
                  </label>
                  <Select
                    size="sm"
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(Number(e.target.value))}
                    options={[
                      { value: 1, label: 'Chỉ 1 lượt duy nhất (Sát hạch chuẩn)' },
                      { value: 2, label: 'Tối đa 2 lượt (Lấy điểm cao nhất)' },
                      { value: 3, label: 'Tối đa 3 lượt' },
                      { value: 0, label: 'Không giới hạn (Khuyên dùng cho Đề luyện)' },
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Live Blueprint Preview Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  TỔNG QUAN MA TRẬN ĐỀ THI
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  {configMode === 'exam' ? 'Đề sát hạch' : 'Đề luyện'}
                </span>
              </div>

              {/* Stat Highlights */}
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                  <div className="text-[11px] text-slate-400 font-medium">Tổng số câu</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                    {totalQuestions}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                  <div className="text-[11px] text-slate-400 font-medium">Thời lượng</div>
                  <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
                    {durationMinutes}'
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                  <div className="text-[11px] text-slate-400 font-medium">Điểm đạt</div>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {passingPercentage}%
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                  <div className="text-[11px] text-slate-400 font-medium">Câu điểm liệt</div>
                  <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
                    {criticalCount} câu
                  </div>
                </div>
              </div>

              {/* Progress bar of ISA-95 distribution */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  <span>Tỷ trọng Level ISA-95:</span>
                  <span className="text-[11px] text-slate-400">{currentLevelTotal} câu</span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden">
                  <div style={{ width: `${(l0Count / (totalQuestions || 1)) * 100}%` }} className="bg-blue-500" title={`Level 0: ${l0Count} câu`} />
                  <div style={{ width: `${(l1Count / (totalQuestions || 1)) * 100}%` }} className="bg-sky-400" title={`Level 1: ${l1Count} câu`} />
                  <div style={{ width: `${(l2Count / (totalQuestions || 1)) * 100}%` }} className="bg-amber-400" title={`Level 2: ${l2Count} câu`} />
                  <div style={{ width: `${(l3Count / (totalQuestions || 1)) * 100}%` }} className="bg-purple-500" title={`Level 3: ${l3Count} câu`} />
                </div>
                <div className="grid grid-cols-2 gap-1 mt-2 text-[11px] text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> L0: {l0Count} câu
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> L1: {l1Count} câu
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> L2: {l2Count} câu
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> L3: {l3Count} câu
                  </div>
                </div>
              </div>

              {/* Location & Restrictions Details */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-xs flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <MapPin size={13} className="text-amber-500 shrink-0" />
                  <span className="truncate">
                    Vị trí: <strong>{location === 'workshop-offset-1' ? 'Xưởng In Offset' : location === 'workshop-smt-4' ? 'Xưởng SMT - Trạm 04' : 'Lab Khảo thí A'}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Users size={13} className="text-blue-500 shrink-0" />
                  <span className="truncate">
                    Đối tượng: <strong>{targetGroup === 'grp-mes' ? 'Kỹ sư MES' : targetGroup === 'grp-op' ? 'Vận hành viên' : 'Đội bảo trì'}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Lock size={13} className="text-purple-500 shrink-0" />
                  <span>
                    Chống gian lận: <strong>{tabSwitchLock ? 'Khóa Tab nghiêm ngặt' : 'Mở tự do'}</strong>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  icon={Save}
                  type="submit"
                  className="w-full justify-center"
                >
                  Lưu cấu hình quy chuẩn
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Plus}
                  type="button"
                  onClick={() => navigate('/manage/assessments/new')}
                  className="w-full justify-center"
                >
                  Tạo bộ đề mới theo mẫu này
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
