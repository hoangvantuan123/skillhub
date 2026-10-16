import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../../shared/components/PageHeader';
import Card from '../../../shared/ui/Card';
import Input from '../../../shared/ui/Input';
import Button from '../../../shared/ui/Button';
import Badge from '../../../shared/ui/Badge';
import { mockSubjects, mockTopics, mockQuestions, mockGroups } from '../../../mocks/mockData';
import { mockApi } from '../../../mocks/mockService';
import { useToast } from '../../../shared/hooks/useToast';
import { ArrowLeft, CheckCircle2, Eye, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function AssessmentEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToast } = useToast();

  const [title, setTitle] = useState('Bộ đề Đánh giá Năng lực Kỹ sư MES & Smart Factory 2026');
  const [code, setCode] = useState('DE-MES-ADV-2026');
  const [subjectId, setSubjectId] = useState('sub-mes');
  const [targetGroup, setTargetGroup] = useState('grp-mes');
  const [targetRank, setTargetRank] = useState('all');
  const [hasCriticalRule, setHasCriticalRule] = useState(true);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [passingScore, setPassingScore] = useState(7);
  const [selectedQuestions, setSelectedQuestions] = useState(['q-mes-l0-sensor', 'q-mes-l1-plc', 'q-mes-l2-hmi', 'q-mes-l3-recall', 'q-mes-1', 'q-mes-2']);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (id && id !== 'new') {
      mockApi.getAssessmentById(id).then((res) => {
        if (res.data) {
          setTitle(res.data.title);
          setCode(res.data.code);
          setSubjectId(res.data.subjectId);
          setDurationMinutes(res.data.durationMinutes);
          setPassingScore(res.data.passingScore);
          setSelectedQuestions(res.data.questions || []);
          if (res.data.targetRank) setTargetRank(res.data.targetRank);
          if (res.data.hasCriticalRule !== undefined) setHasCriticalRule(res.data.hasCriticalRule);
        }
      });
    }
  }, [id]);

  const questionsPool = mockQuestions;
  const activeQuestions = questionsPool.filter((q) => selectedQuestions.includes(q.id));

  // Matrix stats
  const levelCounts = {
    L0: activeQuestions.filter((q) => q.level === 'L0').length,
    L1: activeQuestions.filter((q) => q.level === 'L1').length,
    L2: activeQuestions.filter((q) => q.level === 'L2').length,
    L3: activeQuestions.filter((q) => q.level === 'L3' || !q.level).length,
  };
  const criticalCount = activeQuestions.filter((q) => q.isCritical).length;
  const simulationCount = activeQuestions.filter((q) => q.format === 'simulation_hmi').length;

  const toggleQuestion = (qId) => {
    if (selectedQuestions.includes(qId)) {
      setSelectedQuestions(selectedQuestions.filter((x) => x !== qId));
    } else {
      setSelectedQuestions([...selectedQuestions, qId]);
    }
  };

  const handlePublish = async () => {
    if (selectedQuestions.length === 0) {
      addToast('Bộ đề phải có ít nhất 1 câu hỏi!', 'warning');
      return;
    }

    const grp = mockGroups.find((g) => g.id === targetGroup);
    const sub = mockSubjects.find((s) => s.id === subjectId);

    const payload = {
      code,
      title,
      subjectId,
      subjectName: sub ? sub.name : 'Chuyên môn',
      targetGroup,
      targetGroupName: grp ? grp.name : 'Tất cả các nhóm',
      targetRank,
      hasCriticalRule,
      durationMinutes: Number(durationMinutes),
      totalPoints: 10,
      passingScore: Number(passingScore),
      questions: selectedQuestions,
      status: 'published',
      publishedAt: new Date().toISOString(),
    };

    await mockApi.createAssessment(payload);
    addToast('Đã chốt danh sách câu hỏi và xuất bản phiên bản bộ đề thành công!', 'success');
    navigate('/manage/assessments');
  };

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
      <PageHeader
        title={id && id !== 'new' ? `Chi tiết bộ đề: ${code}` : 'Thiết lập & Xuất bản bộ đề thi (MES L0-L3)'}
        subtitle="Cấu hình ma trận câu hỏi đa cấp độ ISA-95 (L0-L3), quy tắc Điểm liệt tuyệt đối và phân bổ theo nhóm cấp bậc."
        backAction={
          <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate('/manage/assessments')}>
            Quay lại danh sách
          </Button>
        }
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="outline" icon={Eye} onClick={() => setPreviewMode(!previewMode)}>
              {previewMode ? 'Chỉnh sửa ma trận' : 'Xem trước đề thi'}
            </Button>
            <Button variant="primary" icon={CheckCircle2} onClick={handlePublish}>
              Xuất bản phiên bản đề
            </Button>
          </div>
        }
      />

      {previewMode ? (
        /* Preview Mode */
        <Card style={{ padding: '28px' }}>
          <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Badge variant="purple">Xem trước bộ đề (Preview Mode)</Badge>
              <span style={{ fontSize: '13px', color: 'var(--navy-muted)' }}>Thời lượng: {durationMinutes} phút · Điểm đạt: {passingScore}/10</span>
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--navy)', marginTop: '8px' }}>{title}</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {activeQuestions.map((q, idx) => (
              <div key={q.id} style={{ padding: '16px', borderRadius: '10px', background: 'var(--surface-canvas)', border: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong style={{ color: 'var(--color-primary-600)', fontSize: '13px' }}>Câu {idx + 1} ({q.difficultyLabel})</strong>
                  <span style={{ fontSize: '11px', color: 'var(--navy-muted)' }}>Mã: {q.id} · v{q.version}</span>
                </div>
                <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--navy)', marginBottom: '12px' }}>{q.content}</p>

                {q.options && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} style={{ fontSize: '13px', padding: '6px 10px', borderRadius: '6px', background: opt.isCorrect ? 'var(--color-success-bg)' : '#ffffff', border: opt.isCorrect ? '1px solid var(--color-success-border)' : '1px solid var(--line-subtle)' }}>
                        {String.fromCharCode(65 + oIdx)}. {opt.text} {opt.isCorrect && ' (Đáp án chuẩn)'}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      ) : (
        /* Editor Mode */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card style={{ padding: '22px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', color: 'var(--navy)' }}>
              Thông tin cấu hình đề
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '16px' }}>
              <Input label="Mã bộ đề" value={code} onChange={(e) => setCode(e.target.value)} />
              
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--navy)', display: 'block', marginBottom: '6px' }}>
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
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--navy)', display: 'block', marginBottom: '6px' }}>
                  Nhóm đối tượng áp dụng
                </label>
                <select
                  value={targetGroup}
                  onChange={(e) => setTargetGroup(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '13px' }}
                >
                  <option value="all">Tất cả các nhóm</option>
                  {mockGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--navy)', display: 'block', marginBottom: '6px' }}>
                  Cấp bậc thăng tiến mục tiêu
                </label>
                <select
                  value={targetRank}
                  onChange={(e) => setTargetRank(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '13px', fontWeight: '600' }}
                >
                  <option value="all">Tất cả các bậc năng lực</option>
                  <option value="Fresher (Bậc 1)">Fresher / Kỹ sư Mới vào nghề (Bậc 1)</option>
                  <option value="Chuyên viên (Bậc 2)">Chuyên viên Kỹ thuật (Bậc 2)</option>
                  <option value="Chuyên viên chính (Bậc 3)">Chuyên viên chính (Senior Engineer - Bậc 3)</option>
                  <option value="Kỹ sư trưởng (Bậc 4)">Kỹ sư trưởng / Lead MES (Bậc 4)</option>
                </select>
              </div>

              <Input label="Thời lượng thi (phút)" type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
              <Input label="Điểm sàn đạt chuẩn (/10)" type="number" value={passingScore} onChange={(e) => setPassingScore(e.target.value)} />
            </div>

            <Input label="Tên bộ đề thi" value={title} onChange={(e) => setTitle(e.target.value)} />

            {/* Critical Knockout Rule Toggle */}
            <div style={{ marginTop: '16px', background: hasCriticalRule ? '#fef2f2' : 'var(--surface-subtle)', border: hasCriticalRule ? '1px solid #f87171' : '1px solid var(--line)', borderRadius: '10px', padding: '14px 18px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={hasCriticalRule}
                  onChange={(e) => setHasCriticalRule(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: '#dc2626' }}
                />
                <span style={{ fontWeight: '800', fontSize: '13px', color: hasCriticalRule ? '#b91c1c' : 'var(--navy)' }}>
                  ⚡ Kích hoạt Quy tắc Điểm liệt Tuyệt đối (Zero-Tolerance Knockout Rule)
                </span>
              </label>
              <div style={{ fontSize: '12px', color: hasCriticalRule ? '#991b1b' : 'var(--navy-muted)', marginTop: '4px', marginLeft: '28px' }}>
                Thí sinh phải trả lời đúng 100% tất cả các câu hỏi điểm liệt ({criticalCount} câu trong đề). Trả lời sai bất kỳ câu điểm liệt nào sẽ bị tính TRƯỢT kỳ thi ngay lập tức.
              </div>
            </div>
          </Card>

          {/* Matrix Analytics & Question Selection */}
          <Card style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--navy)' }}>
                  Chọn danh sách câu hỏi ({selectedQuestions.length} câu đã chọn)
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--navy-muted)' }}>
                  Ma trận phân tầng tự động theo chuẩn ISA-95 (L0-L3) và câu hỏi mô phỏng.
                </span>
              </div>

              {/* Realtime Matrix Badges */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span className="badge-level badge-level-l0">L0: {levelCounts.L0} câu</span>
                <span className="badge-level badge-level-l1">L1: {levelCounts.L1} câu</span>
                <span className="badge-level badge-level-l2">L2: {levelCounts.L2} câu</span>
                <span className="badge-level badge-level-l3">L3: {levelCounts.L3} câu</span>
                {criticalCount > 0 && (
                  <span className="badge-critical">⚡ {criticalCount} Điểm liệt</span>
                )}
                {simulationCount > 0 && (
                  <Badge variant="info">🎮 {simulationCount} Mô phỏng</Badge>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {questionsPool.map((q) => {
                const isSelected = selectedQuestions.includes(q.id);
                return (
                  <div
                    key={q.id}
                    onClick={() => toggleQuestion(q.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid var(--color-primary-400)' : '1px solid var(--line)',
                      background: isSelected ? 'var(--color-primary-50)' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      style={{ marginTop: '3px', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span className={`badge-level badge-level-${(q.level || 'L3').toLowerCase()}`}>{q.level || 'L3'}</span>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--navy)' }}>{q.id}</span>
                        {q.isCritical && <span className="badge-critical">⚡ ĐIỂM LIỆT</span>}
                        {q.format === 'simulation_hmi' && <Badge variant="info">🎮 Mô phỏng HMI</Badge>}
                        <Badge variant="info" size="sm">{q.difficultyLabel}</Badge>
                        <span style={{ fontSize: '11px', color: 'var(--navy-muted)' }}>{q.topicName}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--navy)', lineHeight: '1.4' }}>{q.content}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
