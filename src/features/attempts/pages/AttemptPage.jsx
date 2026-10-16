import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockApi } from '../../../mocks/mockService';
import { NetworkContext } from '../../../app/providers';
import { useToast } from '../../../shared/hooks/useToast';
import { formatDuration, generateIdempotencyKey } from '../../../shared/lib/formatters';
import { storage } from '../../../shared/lib/storage';
import Card from '../../../shared/ui/Card';
import Button from '../../../shared/ui/Button';
import Badge from '../../../shared/ui/Badge';
import Modal from '../../../shared/ui/Modal';
import InteractiveHmiSimulation from '../../questions/components/InteractiveHmiSimulation';
import {
  Clock,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send,
} from 'lucide-react';

export default function AttemptPage() {
  const navigate = useNavigate();
  const { attemptId } = useParams();
  const { isOnline } = useContext(NetworkContext);
  const { addToast } = useToast();

  const [attempt, setAttempt] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [saveStatus, setSaveStatus] = useState('Đã lưu');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load Attempt snapshot
  useEffect(() => {
    mockApi.getAttempt(attemptId).then((res) => {
      const data = res.data;
      setAttempt(data);

      // Check if there is an offline cached draft for this attempt
      const localDraft = storage.getAttemptAnswersDraft(attemptId);
      if (localDraft && localDraft.answers) {
        setAnswers(localDraft.answers);
        addToast('Đã khôi phục các câu trả lời lưu tạm trước đó.', 'info');
      } else if (data.answers) {
        setAnswers(data.answers);
      }

      // Calculate initial remaining seconds based on deadline
      if (data.deadline) {
        const remaining = Math.max(0, Math.floor((new Date(data.deadline).getTime() - Date.now()) / 1000));
        setTimeLeft(remaining);
      }
    });
  }, [attemptId]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      handleAutoSubmitOnTimeout();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmitOnTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleAutoSubmitOnTimeout = () => {
    addToast('Đã hết giờ thi! Hệ thống tự động thu bài.', 'warning', 8000);
    executeSubmit();
  };

  const handleSelectAnswer = async (questionId, value) => {
    const nextAnswers = { ...answers, [questionId]: value };
    setAnswers(nextAnswers);
    setSaveStatus('Đang lưu...');

    // Always cache draft locally first (offline resilient)
    storage.saveAttemptAnswersDraft(attemptId, nextAnswers);

    if (isOnline) {
      try {
        await mockApi.saveAnswer(attemptId, questionId, value);
        setSaveStatus(`Đã lưu (${new Date().toLocaleTimeString('vi-VN')})`);
      } catch (err) {
        setSaveStatus('Lưu tạm máy (chờ đồng bộ)');
      }
    } else {
      setSaveStatus('Offline: Đã lưu tạm');
    }
  };

  const executeSubmit = async () => {
    setSubmitting(true);
    try {
      const idempotencyKey = generateIdempotencyKey();
      const res = await mockApi.submitAttempt(attemptId, idempotencyKey);
      const receipt = res.data;
      addToast('Nộp bài thi thành công!', 'success');
      navigate(`/app/results/${attemptId}?receipt=${receipt.receiptNumber}`);
    } catch (e) {
      alert('Lỗi nộp bài: ' + e.message);
      setSubmitting(false);
    }
  };

  if (!attempt) {
    return <div style={{ padding: '60px', textAlign: 'center' }}>Đang nạp đề thi...</div>;
  }

  const questions = attempt.questions || [];
  const currentQ = questions[currentIdx] || {};
  const currentAnswer = answers[currentQ.id];
  const answeredCount = Object.keys(answers).length;
  const isTimeCritical = timeLeft < 5 * 60; // under 5 minutes

  return (
    <div>
      {/* Topbar for Exam Session */}
      <header className="exam-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1, overflow: 'hidden' }}>
          <strong
            style={{
              fontSize: '14px',
              color: 'var(--navy)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {attempt.examTitle}
          </strong>
          <span
            className="desktop-only"
            style={{
              fontSize: '11px',
              color: 'var(--navy-muted)',
              background: 'var(--surface-subtle)',
              padding: '3px 8px',
              borderRadius: '4px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Lượt thi: #{attempt.id}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Network status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: isOnline ? '#059669' : '#dc2626' }}>
            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span className="desktop-only" style={{ fontWeight: '600' }}>{isOnline ? 'Online' : 'Mất mạng'}</span>
          </div>

          {/* Auto-save status */}
          <div className="desktop-only" style={{ fontSize: '12px', color: 'var(--navy-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={14} color="#059669" />
            <span>{saveStatus}</span>
          </div>

          {/* Countdown Clock */}
          <div className={`exam-timer ${isTimeCritical ? 'warning' : ''}`}>
            <Clock size={16} />
            <span>{formatDuration(timeLeft)}</span>
          </div>

          {/* Submit button */}
          <Button variant="danger" size="sm" icon={Send} onClick={() => setShowSubmitModal(true)}>
            Nộp bài
          </Button>
        </div>
      </header>

      {/* Mobile Horizontal Question Navigator */}
      <div className="exam-mobile-pills">
        {questions.map((q, idx) => {
          const isAnswered = !!answers[q.id];
          const isCurrent = currentIdx === idx;
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIdx(idx)}
              style={{
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: '700',
                border: isCurrent ? '2px solid var(--color-primary-600)' : '1px solid var(--line)',
                background: isAnswered ? 'var(--color-primary-600)' : '#ffffff',
                color: isAnswered ? '#ffffff' : 'var(--navy)',
                flexShrink: 0,
                cursor: 'pointer',
              }}
            >
              Câu {idx + 1} {isAnswered && '✓'}
            </button>
          );
        })}
      </div>

      {/* Main Exam Area */}
      <div className="exam-content">
        {/* Left: Active Question Card */}
        <div>
          <Card style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--line-subtle)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-primary-600)' }}>
                  Câu {currentIdx + 1} / {questions.length}
                </span>
                {currentQ.level && (
                  <span className={`badge-level badge-level-${currentQ.level.toLowerCase()}`}>
                    {currentQ.level}
                  </span>
                )}
                {currentQ.isCritical && (
                  <span className="badge-critical">
                    ⚡ ĐIỂM LIỆT (BẮT BUỘC ĐÚNG)
                  </span>
                )}
                <Badge variant="purple" size="sm">
                  {currentQ.difficultyLabel || 'Thông hiểu'}
                </Badge>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--navy-muted)' }}>
                {currentAnswer ? 'Đã trả lời ✓' : 'Chưa trả lời'}
              </span>
            </div>

            <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--navy)', lineHeight: '1.6', marginBottom: '20px' }}>
              {currentQ.content}
            </h3>

            {/* Live HMI Simulation if applicable */}
            {currentQ.format === 'simulation_hmi' && (
              <InteractiveHmiSimulation
                question={currentQ}
                onComplete={() => {
                  const correctOpt = currentQ.options?.find((o) => o.isCorrect);
                  if (correctOpt) {
                    handleSelectAnswer(currentQ.id, correctOpt.id);
                  }
                }}
              />
            )}

            {/* Render question based on type */}
            {currentQ.type === 'single_choice' && currentQ.options ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {currentQ.options.map((opt, oIdx) => {
                  const isSelected = currentAnswer === opt.id;
                  return (
                    <div
                      key={opt.id || oIdx}
                      onClick={() => handleSelectAnswer(currentQ.id, opt.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '14px 16px',
                        minHeight: '52px',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid var(--color-primary-600)' : '1px solid var(--line)',
                        background: isSelected ? 'var(--color-primary-50)' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxSizing: 'border-box',
                      }}
                    >
                      <input
                        type="radio"
                        name={`q-${currentQ.id}`}
                        checked={isSelected}
                        onChange={() => {}}
                        style={{ width: '20px', height: '20px', cursor: 'pointer', flexShrink: 0 }}
                      />
                      <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--navy)' }}>
                        {String.fromCharCode(65 + oIdx)}.
                      </span>
                      <span style={{ fontSize: '13px', color: 'var(--navy)', lineHeight: '1.4', flex: 1 }}>
                        {opt.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Essay question textarea */
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--navy)', display: 'block', marginBottom: '8px' }}>
                  Nhập câu trả lời tự luận của bạn:
                </label>
                <textarea
                  rows={7}
                  value={currentAnswer || ''}
                  onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                  placeholder="Trình bày chi tiết quan điểm, lập luận và ví dụ thực tế..."
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxSizing: 'border-box',
                    lineHeight: '1.6',
                  }}
                />
              </div>
            )}

            {/* Navigation buttons (Desktop) */}
            <div className="desktop-only" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '28px', borderTop: '1px solid var(--line-subtle)', paddingTop: '18px' }}>
              <Button
                variant="outline"
                disabled={currentIdx === 0}
                icon={ChevronLeft}
                onClick={() => setCurrentIdx((prev) => prev - 1)}
              >
                Câu trước
              </Button>

              <Button
                variant="secondary"
                disabled={currentIdx === questions.length - 1}
                icon={ChevronRight}
                iconPosition="right"
                onClick={() => setCurrentIdx((prev) => prev + 1)}
              >
                Câu tiếp theo
              </Button>
            </div>
          </Card>
        </div>

        {/* Right: Question Navigation Matrix (Desktop only) */}
        <div className="exam-desktop-matrix">
          <Card style={{ padding: '20px', position: 'sticky', top: '80px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--navy)', marginBottom: '12px' }}>
              Danh sách câu hỏi
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '20px' }}>
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isCurrent = currentIdx === idx;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    style={{
                      height: '40px',
                      borderRadius: '8px',
                      fontWeight: '700',
                      fontSize: '13px',
                      border: isCurrent ? '2px solid var(--color-primary-600)' : '1px solid var(--line)',
                      background: isAnswered ? 'var(--color-primary-600)' : '#ffffff',
                      color: isAnswered ? '#ffffff' : 'var(--navy)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid var(--line-subtle)', paddingTop: '14px', fontSize: '12px', color: 'var(--navy-muted)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Đã hoàn thành:</span>
                <strong style={{ color: 'var(--color-primary-600)' }}>
                  {answeredCount} / {questions.length} câu
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Chưa trả lời:</span>
                <strong style={{ color: '#dc2626' }}>
                  {questions.length - answeredCount} câu
                </strong>
              </div>
            </div>

            <Button
              variant="primary"
              style={{ width: '100%', marginTop: '16px' }}
              onClick={() => setShowSubmitModal(true)}
            >
              Nộp bài thi ngay
            </Button>
          </Card>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="exam-mobile-bottom-bar">
        <Button
          variant="outline"
          size="sm"
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
        >
          <ChevronLeft size={16} /> Câu trước
        </Button>

        <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: '700', color: 'var(--navy)' }}>
          <div>Câu {currentIdx + 1} / {questions.length}</div>
          <div style={{ fontSize: '11px', color: 'var(--navy-muted)', fontWeight: '500' }}>
            Đã làm {answeredCount}/{questions.length}
          </div>
        </div>

        {currentIdx < questions.length - 1 ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
          >
            Câu tiếp <ChevronRight size={16} />
          </Button>
        ) : (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowSubmitModal(true)}
          >
            Nộp bài
          </Button>
        )}
      </div>

      {/* Confirmation Submit Modal */}
      <Modal
        open={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Xác nhận nộp bài thi"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowSubmitModal(false)}>
              Làm tiếp
            </Button>
            <Button variant="danger" loading={submitting} onClick={executeSubmit}>
              Xác nhận nộp bài
            </Button>
          </>
        }
      >
        <p style={{ fontSize: '13px', color: 'var(--navy)', lineHeight: '1.6', marginBottom: '14px' }}>
          Bạn đã hoàn thành <strong>{answeredCount} / {questions.length} câu hỏi</strong>.
        </p>

        {answeredCount < questions.length && (
          <div style={{ padding: '10px 14px', background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning-border)', borderRadius: '8px', fontSize: '12px', color: 'var(--color-warning-text)', marginBottom: '14px' }}>
            ⚠️ <strong>Lưu ý:</strong> Bạn vẫn còn <strong>{questions.length - answeredCount} câu chưa làm</strong>. Khi nộp, bạn sẽ không thể quay lại chỉnh sửa.
          </div>
        )}

        <p style={{ fontSize: '12px', color: 'var(--navy-muted)' }}>
          Hệ thống sẽ sinh biên nhận nộp bài nguyên tử (Atomic & Idempotent Receipt).
        </p>
      </Modal>
    </div>
  );
}
