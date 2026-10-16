import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../shared/components/PageHeader';
import Card from '../../../shared/ui/Card';
import Button from '../../../shared/ui/Button';
import Badge from '../../../shared/ui/Badge';
import { mockSubjects, mockTopics } from '../../../mocks/mockData';
import { Dumbbell, Play, Sparkles, BookOpen } from 'lucide-react';

export default function PracticeSetupPage() {
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState('sub-1');
  const [selectedDifficulty, setSelectedDifficulty] = useState('application');
  const [questionCount, setQuestionCount] = useState(5);

  const handleStartPractice = () => {
    navigate(`/app/practice/player?subjectId=${selectedSubject}&difficulty=${selectedDifficulty}&count=${questionCount}`);
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <PageHeader
        title="Luyện tập & Củng cố kiến thức"
        subtitle="Chọn chủ đề, độ khó để luyện tập tự do không áp lực thời gian. Kiểm tra đáp án và đọc giải thích chi tiết ngay lập tức."
      />

      <Card style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
        <div>
          <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--navy)', display: 'block', marginBottom: '8px' }}>
            1. Chọn chuyên môn luyện tập:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            {mockSubjects.map((s) => {
              const isSelected = selectedSubject === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedSubject(s.id)}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    border: isSelected ? '2px solid var(--color-primary-600)' : '1px solid var(--line)',
                    background: isSelected ? 'var(--color-primary-50)' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <strong style={{ fontSize: '13px', color: 'var(--navy)', display: 'block' }}>{s.name}</strong>
                  <span style={{ fontSize: '11px', color: 'var(--navy-muted)' }}>{s.questionCount} câu hỏi sẵn sàng</span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--navy)', display: 'block', marginBottom: '8px' }}>
            2. Mức độ nhận thức:
          </label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { id: 'knowledge', label: 'Nhận biết' },
              { id: 'comprehension', label: 'Thông hiểu' },
              { id: 'application', label: 'Vận dụng' },
              { id: 'analysis', label: 'Vận dụng cao' },
            ].map((lvl) => {
              const isSelected = selectedDifficulty === lvl.id;
              return (
                <button
                  key={lvl.id}
                  onClick={() => setSelectedDifficulty(lvl.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: isSelected ? '1px solid var(--color-primary-600)' : '1px solid var(--line)',
                    background: isSelected ? 'var(--color-primary-600)' : '#ffffff',
                    color: isSelected ? '#ffffff' : 'var(--navy)',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  {lvl.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--navy)', display: 'block', marginBottom: '8px' }}>
            3. Số lượng câu hỏi mỗi phiên:
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {[3, 5, 10, 15].map((cnt) => (
              <button
                key={cnt}
                onClick={() => setQuestionCount(cnt)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: questionCount === cnt ? '1px solid var(--color-primary-600)' : '1px solid var(--line)',
                  background: questionCount === cnt ? 'var(--color-primary-50)' : '#ffffff',
                  color: questionCount === cnt ? 'var(--color-primary-700)' : 'var(--navy)',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {cnt} câu
              </button>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--line)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="primary" size="lg" icon={Play} onClick={handleStartPractice}>
            Bắt đầu luyện tập ngay
          </Button>
        </div>
      </Card>
    </div>
  );
}
