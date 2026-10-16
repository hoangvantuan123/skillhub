import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../../../shared/components/PageHeader';
import Card from '../../../shared/ui/Card';
import Button from '../../../shared/ui/Button';
import Badge from '../../../shared/ui/Badge';
import { mockApi } from '../../../mocks/mockService';
import { ArrowLeft, CheckCircle2, XCircle, Lightbulb, ChevronRight, RotateCcw, Home } from 'lucide-react';
import InteractiveHmiSimulation from '../../questions/components/InteractiveHmiSimulation';

export default function PracticePlayerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subjectId = searchParams.get('subjectId') || 'sub-1';
  const difficulty = searchParams.get('difficulty') || 'application';
  const count = Number(searchParams.get('count')) || 5;

  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    mockApi.getPracticeQuestions({ subjectId, difficulty, count }).then((res) => {
      setQuestions(res.data || []);
    });
  }, [subjectId, difficulty, count]);

  if (questions.length === 0) {
    return <div style={{ padding: '60px', textAlign: 'center' }}>Đang chuẩn bị đề luyện tập...</div>;
  }

  const currentQ = questions[currentIdx];

  const handleCheckAnswer = () => {
    if (!selectedOption) return;
    setIsSubmitted(true);
    const chosen = currentQ.options.find((o) => o.id === selectedOption);
    if (chosen?.isCorrect) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    } else {
      setIsFinished(true);
    }
  };

  if (isFinished) {
    return (
      <div style={{ maxWidth: '640px', margin: '40px auto' }}>
        <Card style={{ padding: '36px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--color-primary-50)', color: 'var(--color-primary-600)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
            <CheckCircle2 size={36} />
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--navy)', marginBottom: '8px' }}>
            Hoàn thành phiên luyện tập!
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--navy-muted)', marginBottom: '20px' }}>
            Bạn đã trả lời đúng <strong>{score} / {questions.length} câu hỏi</strong>.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <Button variant="secondary" icon={RotateCcw} onClick={() => window.location.reload()}>
              Luyện lại đề này
            </Button>
            <Button variant="primary" icon={Home} onClick={() => navigate('/app')}>
              Về trang tổng quan
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1060px', margin: '0 auto' }}>
      <PageHeader
        title={`Luyện tập: Câu ${currentIdx + 1} / ${questions.length}`}
        subtitle={`Chủ đề: ${currentQ.topicName || 'Chung'} · Cấp độ: ${currentQ.level || 'L3'} · Mức độ: ${currentQ.difficultyLabel || 'Thông hiểu'}`}
        backAction={
          <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate('/app/practice')}>
            Thoát luyện tập
          </Button>
        }
      />

      <Card style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
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

        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--navy)', lineHeight: '1.6', marginBottom: '16px' }}>
          {currentQ.content}
        </h3>

        {/* Live HMI Simulation if applicable */}
        {currentQ.format === 'simulation_hmi' && (
          <InteractiveHmiSimulation
            question={currentQ}
            onComplete={() => {
              const correctOpt = currentQ.options?.find((o) => o.isCorrect);
              if (correctOpt) {
                setSelectedOption(correctOpt.id);
              }
            }}
          />
        )}

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {currentQ.options.map((opt, idx) => {
            let bgColor = '#ffffff';
            let borderColor = 'var(--line)';

            if (isSubmitted) {
              if (opt.isCorrect) {
                bgColor = 'var(--color-success-bg)';
                borderColor = 'var(--color-success-border)';
              } else if (selectedOption === opt.id) {
                bgColor = 'var(--color-danger-bg)';
                borderColor = 'var(--color-danger-border)';
              }
            } else if (selectedOption === opt.id) {
              bgColor = 'var(--color-primary-50)';
              borderColor = 'var(--color-primary-600)';
            }

            return (
              <div
                key={opt.id}
                onClick={() => !isSubmitted && setSelectedOption(opt.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: `1.5px solid ${borderColor}`,
                  background: bgColor,
                  cursor: isSubmitted ? 'default' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--navy)' }}>
                  {String.fromCharCode(65 + idx)}.
                </span>
                <span style={{ fontSize: '13px', color: 'var(--navy)', flex: 1 }}>{opt.text}</span>
                {isSubmitted && opt.isCorrect && <CheckCircle2 size={18} color="#059669" />}
                {isSubmitted && selectedOption === opt.id && !opt.isCorrect && <XCircle size={18} color="#dc2626" />}
              </div>
            );
          })}
        </div>

        {/* Explanation Card upon submission */}
        {isSubmitted && (
          <div style={{ background: 'var(--surface-canvas)', border: '1px solid var(--line)', borderRadius: '10px', padding: '16px 18px', marginBottom: '24px', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary-600)', marginBottom: '6px' }}>
              <Lightbulb size={18} />
              <strong style={{ fontSize: '13px' }}>Giải thích chi tiết & Tham chiếu:</strong>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--navy)', lineHeight: '1.6', margin: 0 }}>
              {currentQ.explanation}
            </p>
          </div>
        )}

        {/* Action button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          {!isSubmitted ? (
            <Button variant="primary" disabled={!selectedOption} onClick={handleCheckAnswer}>
              Kiểm tra đáp án
            </Button>
          ) : (
            <Button variant="primary" icon={ChevronRight} iconPosition="right" onClick={handleNext}>
              {currentIdx < questions.length - 1 ? 'Câu tiếp theo' : 'Xem kết quả'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
