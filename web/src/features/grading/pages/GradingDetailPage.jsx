import ManagementFrame from '../../../shared/ui/ManagementFrame';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../../shared/ui/Card';

import Button from '../../../shared/ui/Button';
import Badge from '../../../shared/ui/Badge';
import { mockApi } from '../../../mocks/mockService';
import { useToast } from '../../../shared/hooks/useToast';

import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function GradingDetailPage() {
  const navigate = useNavigate();
  const { submissionId } = useParams();
  const { addToast } = useToast();

  const [submission, setSubmission] = useState(null);
  const [rubrics, setRubrics] = useState([]);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    mockApi.getGradingQueue().then((res) => {
      const found = res.data?.find((s) => s.id === submissionId);
      if (found) {
        setSubmission(found);
        setRubrics(found.rubrics || []);
        setFeedback(found.graderFeedback || '');
      }
    });
  }, [submissionId]);

  if (!submission) return <div>Đang nạp bài thi...</div>;

  const currentTotal = rubrics.reduce((acc, r) => acc + (Number(r.score) || 0), 0);
  const maxPossible = rubrics.reduce((acc, r) => acc + (Number(r.maxScore) || 0), 0);

  const handleScoreChange = (rIdx, val) => {
    const next = [...rubrics];
    next[rIdx].score = Math.min(next[rIdx].maxScore, Math.max(0, Number(val)));
    setRubrics(next);
  };

  const handleFeedbackChange = (rIdx, val) => {
    const next = [...rubrics];
    next[rIdx].feedback = val;
    setRubrics(next);
  };

  const handleSaveDraft = async () => {
    await mockApi.saveGradingScores(submissionId, rubrics, feedback, false);
    addToast('Đã lưu điểm tạm thời cho bài thi.', 'info');
  };

  const handleFinalize = async () => {
    await mockApi.saveGradingScores(submissionId, rubrics, feedback, true);
    addToast('Đã chốt điểm bài thi chính thức và ghi vào nhật ký kiểm toán!', 'success');
    navigate('/manage/grading');
  };

  return (
    <ManagementFrame className="management-screen"
header={<><div className="management-tabs"><span className="management-tab-active">Chi tiết</span>{null}</div><div className="management-actions">{<Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate('/manage/grading')}>
            Quay lại danh sách chấm
          </Button>}{<div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="outline" onClick={handleSaveDraft}>
              Lưu điểm tạm
            </Button>
            <Button variant="primary" icon={CheckCircle2} onClick={handleFinalize}>
              Chốt điểm chính thức ({currentTotal}/{maxPossible}đ)
            </Button>
          </div>}</div></>}

status={<><strong>{`Chấm bài thi: ${submission.candidateName}`}</strong></>}
>
<div className="management-body-scroll">
<div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        {/* Candidate essay answer */}
        <Card style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <Badge variant="purple">Đề bài tự luận</Badge>
            <span style={{ fontSize: '12px', color: 'var(--navy-muted)' }}>Thí sinh: {submission.candidateName}</span>
          </div>

          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--navy)', marginBottom: '16px' }}>
            {submission.essayQuestionText}
          </h3>

          <div style={{ background: 'var(--surface-canvas)', border: '1px solid var(--line)', borderRadius: '10px', padding: '16px', fontSize: '13px', lineHeight: '1.7', whiteSpace: 'pre-wrap', color: 'var(--navy)' }}>
            {submission.candidateAnswer}
          </div>
        </Card>

        {/* Rubric evaluation criteria */}
        <Card style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--navy)' }}>
              Đánh giá theo Rubric tiêu chí
            </h3>
            <div style={{ fontSize: '14px', fontWeight: '800', color: 'var(--color-primary-600)' }}>
              Tổng điểm: {currentTotal} / {maxPossible} điểm
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {rubrics.map((r, rIdx) => (
              <div
                key={r.id}
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid var(--line)',
                  background: 'var(--surface-card)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '13px', color: 'var(--navy)' }}>{r.title}</strong>
                    <p style={{ fontSize: '12px', color: 'var(--navy-muted)', margin: '4px 0 0' }}>{r.description}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max={r.maxScore}
                      value={r.score}
                      onChange={(e) => handleScoreChange(rIdx, e.target.value)}
                      style={{
                        width: '60px',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1.5px solid var(--color-primary-600)',
                        textAlign: 'center',
                        fontWeight: '700',
                        fontSize: '14px',
                      }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--navy-muted)' }}>/ {r.maxScore}đ</span>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Nhận xét riêng cho tiêu chí này..."
                  value={r.feedback || ''}
                  onChange={(e) => handleFeedbackChange(rIdx, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--line-subtle)',
                    fontSize: '12px',
                    background: 'var(--surface-canvas)',
                    marginTop: '8px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Overall feedback */}
          <div style={{ marginTop: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--navy)', display: 'block', marginBottom: '6px' }}>
              Nhận xét tổng quát của giám khảo:
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Ghi nhận xét đóng góp, lời khuyên cho thí sinh..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                fontSize: '13px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </Card>
      </div>
</div>

</ManagementFrame>
  );
}
