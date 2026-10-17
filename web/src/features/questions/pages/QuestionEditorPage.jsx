import ManagementFrame from '../../../shared/ui/ManagementFrame';
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAttributeCatalog from '../../../shared/hooks/useAttributeCatalog';
import Card from '../../../shared/ui/Card';

import Button from '../../../shared/ui/Button';
import Badge from '../../../shared/ui/Badge';
import { mockSubjects, mockTopics, mockGroups } from '../../../mocks/mockData';
import { mockApi } from '../../../mocks/mockService';
import { useToast } from '../../../shared/hooks/useToast';
import { useAuth } from '../../../shared/hooks/useAuth';
import { ArrowLeft, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import InteractiveHmiSimulation from '../components/InteractiveHmiSimulation';

export default function QuestionEditorPage() {
  const navigate = useNavigate();
  const levelCatalog = useAttributeCatalog('level');
  const { id } = useParams();
  const { addToast } = useToast();
  const { currentUser } = useAuth();

  const [type, setType] = useState('single_choice');
  const [level, setLevel] = useState('L2');
  const [format, setFormat] = useState('theory');
  const [simulationType, setSimulationType] = useState('dispatch');
  const [isCritical, setIsCritical] = useState(false);
  const [criticalReason, setCriticalReason] = useState('');
  const [subjectId, setSubjectId] = useState('sub-mes');
  const [topicId, setTopicId] = useState('top-mes-1');
  const [targetGroup, setTargetGroup] = useState('grp-mes');
  const [difficulty, setDifficulty] = useState('application');
  const [content, setContent] = useState('');
  const [explanation, setExplanation] = useState('');

  // Options for single_choice
  const [options, setOptions] = useState([
    { id: '1', text: '', isCorrect: true },
    { id: '2', text: '', isCorrect: false },
    { id: '3', text: '', isCorrect: false },
    { id: '4', text: '', isCorrect: false },
  ]);

  // Rubrics for essay / case
  const [rubrics, setRubrics] = useState([
    { id: '1', title: 'Đúng trọng tâm câu hỏi', maxScore: 5, description: '' },
    { id: '2', title: 'Lập luận và ví dụ thực tế', maxScore: 5, description: '' },
  ]);

  const handleOptionChange = (idx, text) => {
    const next = [...options];
    next[idx].text = text;
    setOptions(next);
  };

  const setCorrectOption = (idx) => {
    const next = options.map((opt, i) => ({ ...opt, isCorrect: i === idx }));
    setOptions(next);
  };

  const handleSave = async (status = 'draft') => {
    if (levelCatalog.loading || levelCatalog.error || !levelCatalog.options.some(option => option.value === level && option.active && option.value !== 'All')) {
      addToast('Vui lòng chọn cấp độ đang sử dụng trong danh mục.', 'warning');
      return;
    }
    if (!content.trim()) {
      addToast('Vui lòng nhập nội dung câu hỏi!', 'warning');
      return;
    }

    const topic = mockTopics.find((t) => t.id === topicId);
    const grp = mockGroups.find((g) => g.id === targetGroup);
    const difficultyLabels = {
      knowledge: 'Nhận biết',
      comprehension: 'Thông hiểu',
      application: 'Vận dụng',
      analysis: 'Vận dụng cao',
    };

    const payload = {
      subjectId,
      topicId,
      topicName: topic ? topic.name : 'Chủ đề',
      targetGroup,
      targetGroupName: grp ? grp.name : 'Tất cả nhóm học viên',
      level,
      levelName: levelCatalog.labelFor(level),
      format,
      simulationType: format === 'simulation_hmi' ? simulationType : undefined,
      isCritical,
      criticalReason: isCritical ? (criticalReason || 'Câu hỏi Điểm liệt bắt buộc đúng') : undefined,
      type,
      difficulty,
      difficultyLabel: difficultyLabels[difficulty],
      status,
      content,
      explanation,
      author: currentUser?.name || 'Người biên soạn',
      options: type === 'single_choice' ? options : null,
      rubrics: type === 'essay' ? rubrics : null,
    };

    await mockApi.createQuestion(payload);
    addToast(
      status === 'pending_review'
        ? 'Đã gửi câu hỏi lên hội đồng chờ phê duyệt!'
        : 'Đã lưu bản nháp câu hỏi thành công!',
      'success'
    );
    navigate('/manage/questions');
  };

  return (
    <ManagementFrame className="management-screen"
header={<><div className="management-tabs"><span className="management-tab-active">Thiết lập</span>{null}</div><div className="management-actions">{<Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate('/manage/questions')}>
            Quay lại danh sách
          </Button>}{null}</div></>}

status={<><strong>{id ? 'Tạo phiên bản mới cho câu hỏi' : 'Soạn câu hỏi mới'}</strong></>}
>
<div className="management-body-scroll">
<Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Classification row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
              {levelCatalog.label || 'Cấp độ'}
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '13px', fontWeight: '700' }}
            >
              {levelCatalog.optionsFor(level, { includeAll: false }).map(option => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
              Định dạng chuyên môn
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '13px' }}
            >
              <option value="theory">Lý thuyết nền tảng</option>
              <option value="case_study">Case tình huống thực tế</option>
              <option value="simulation_hmi">Mô phỏng thao tác HMI/SCADA</option>
              <option value="critical_safety">An toàn & Chất lượng nghiêm ngặt</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
              Chuyên môn
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '13px' }}
            >
              {mockSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
              Chủ đề liên kết
            </label>
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '13px' }}
            >
              {mockTopics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
              Nhóm đối tượng áp dụng
            </label>
            <select
              value={targetGroup}
              onChange={(e) => setTargetGroup(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '13px' }}
            >
              <option value="all">Tất cả các nhóm học viên</option>
              {mockGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
              Mức độ nhận thức
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '13px' }}
            >
              <option value="knowledge">Nhận biết</option>
              <option value="comprehension">Thông hiểu</option>
              <option value="application">Vận dụng</option>
              <option value="analysis">Vận dụng cao</option>
            </select>
          </div>
        </div>

        {/* Critical Question Configuration Row */}
        <div style={{ background: isCritical ? '#fef2f2' : 'var(--surface-subtle)', border: isCritical ? '1px solid #f87171' : '1px solid var(--line)', borderRadius: '10px', padding: '14px 18px', transition: 'all 0.2s ease' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={isCritical}
              onChange={(e) => setIsCritical(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#dc2626' }}
            />
            <span style={{ fontWeight: '800', fontSize: '13px', color: isCritical ? '#b91c1c' : 'var(--navy)' }}>
              ⚡ Thiết lập làm Câu hỏi Điểm liệt (Zero-Tolerance Critical Question)
            </span>
          </label>
          <div style={{ fontSize: '12px', color: isCritical ? '#991b1b' : 'var(--navy-muted)', marginTop: '4px', marginLeft: '28px' }}>
            Nếu đánh dấu là Điểm liệt, thí sinh bắt buộc phải trả lời đúng câu này trong bài thi. Trả lời sai sẽ bị tính trượt kỳ thi dù tổng điểm đủ đỗ.
          </div>
          {isCritical && (
            <div style={{ marginTop: '10px', marginLeft: '28px' }}>
              <input
                type="text"
                placeholder="Nhập lý do điểm liệt (Ví dụ: Quy chuẩn an toàn điện 24VDC, An toàn thu hồi mẻ hàng GMP...)"
                value={criticalReason}
                onChange={(e) => setCriticalReason(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fca5a5', fontSize: '12px' }}
              />
            </div>
          )}
        </div>

        {/* Question content */}
        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
            Nội dung câu hỏi <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nhập đề bài câu hỏi..."
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--line)',
              fontSize: '13px',
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Real-world Manufacturing Simulation Configuration & Sandbox */}
        {format === 'simulation_hmi' && (
          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '10px',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ⚙️ Cấu hình Mô phỏng Sản xuất ISA-95 (HMI / SCADA Sandbox)
                </h4>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#15803d', maxWidth: '640px' }}>
                  Học viên sẽ thao tác trực tiếp trên giao diện điều khiển thực tế (chuyển mạch Auto/Manual, chọn bồn, chỉnh Setpoint RPM, kích hoạt E-Stop). Hệ thống ghi log OPC-UA và tự động đối chiếu quy chuẩn kỹ thuật để chấm điểm.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#166534' }}>Kịch bản mô phỏng:</span>
                <select
                  value={simulationType}
                  onChange={(e) => setSimulationType(e.target.value)}
                  style={{
                    padding: '7px 12px',
                    borderRadius: '6px',
                    border: '1px solid #86efac',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: 'var(--surface-card)',
                    color: '#166534',
                  }}
                >
                  <option value="dispatch">1. Điều độ lệnh sản xuất MES & Cân bằng bồn chứa (L3/L2)</option>
                  <option value="estop">2. Dừng khẩn cấp E-Stop khi quá áp/quá nhiệt (An toàn ISO 13850)</option>
                </select>
              </div>
            </div>

            {/* Live Interactive Sandbox Preview */}
            <div style={{ background: 'var(--surface-card)', borderRadius: '8px', border: '1px solid #bbf7d0', padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                Xem trước tương tác (Interactive Preview dành cho người biên soạn)
              </div>
              <InteractiveHmiSimulation
                question={{
                  id: id || 'preview-sim',
                  simulationType,
                  content: content || 'Đang soạn câu hỏi mô phỏng sản xuất...',
                }}
              />
            </div>
          </div>
        )}

        {/* Single Choice Options */}
        {type === 'single_choice' && (
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '10px' }}>
              Các phương án trả lời (Chọn 1 đáp án đúng):
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {options.map((opt, idx) => (
                <div
                  key={opt.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: opt.isCorrect ? '1px solid var(--color-success-border)' : '1px solid var(--line)',
                    background: opt.isCorrect ? 'var(--color-success-bg)' : '#ffffff',
                  }}
                >
                  <input
                    type="radio"
                    name="correct-option"
                    checked={opt.isCorrect}
                    onChange={() => setCorrectOption(idx)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--navy)' }}>
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Nội dung phương án ${String.fromCharCode(65 + idx)}...`}
                    style={{
                      flex: 1,
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: '13px',
                    }}
                  />
                  {opt.isCorrect && (
                    <Badge variant="success" size="sm">
                      Đáp án đúng
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rubrics for Essay */}
        {type === 'essay' && (
          <div style={{ background: 'var(--surface-subtle)', padding: '16px', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--navy)' }}>
                Tiêu chí chấm Rubric
              </label>
              <Button
                size="sm"
                variant="outline"
                icon={Plus}
                onClick={() =>
                  setRubrics([...rubrics, { id: Date.now().toString(), title: '', maxScore: 5, description: '' }])
                }
              >
                Thêm tiêu chí
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {rubrics.map((r, rIdx) => (
                <div
                  key={r.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'var(--surface-card)',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                  }}
                >
                  <input
                    type="text"
                    value={r.title}
                    placeholder="Tên tiêu chí (vd: Lập luận chặt chẽ)"
                    onChange={(e) => {
                      const next = [...rubrics];
                      next[rIdx].title = e.target.value;
                      setRubrics(next);
                    }}
                    style={{ flex: 1, padding: '6px 10px', border: '1px solid var(--line)', borderRadius: '6px' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <span>Điểm:</span>
                    <input
                      type="number"
                      value={r.maxScore}
                      onChange={(e) => {
                        const next = [...rubrics];
                        next[rIdx].maxScore = Number(e.target.value);
                        setRubrics(next);
                      }}
                      style={{ width: '50px', padding: '6px', borderRadius: '6px', border: '1px solid var(--line)' }}
                    />
                  </div>
                  {rubrics.length > 1 && (
                    <button
                      onClick={() => setRubrics(rubrics.filter((_, i) => i !== rIdx))}
                      style={{ color: '#ef4444', padding: '6px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explanation */}
        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
            Lời giải thích chi tiết (Dành cho người luyện tập & tra cứu sau khi công bố)
          </label>
          <textarea
            rows={3}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="Giải thích vì sao phương án này đúng, liên hệ tài liệu kiến thức..."
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--line)',
              fontSize: '13px',
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Form Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--line)', paddingTop: '18px' }}>
          <Button variant="outline" onClick={() => navigate('/manage/questions')}>
            Hủy
          </Button>
          <Button variant="secondary" onClick={() => handleSave('draft')}>
            Lưu bản nháp
          </Button>
          <Button variant="primary" icon={CheckCircle2} onClick={() => handleSave('pending_review')}>
            Lưu & Gửi phê duyệt
          </Button>
        </div>
      </Card>
</div>

</ManagementFrame>
  );
}
