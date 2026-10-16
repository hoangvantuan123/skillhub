import ManagementFrame from '../../../shared/ui/ManagementFrame';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../../shared/ui/Card';
import Button from '../../../shared/ui/Button';
import Badge from '../../../shared/ui/Badge';
import { mockApi } from '../../../mocks/mockService';
import { useAuth } from '../../../shared/hooks/useAuth';
import { ArrowLeft, CheckCircle2, Clock, ArrowRight } from 'lucide-react';

export default function ExamLobbyPage() {
  const navigate = useNavigate();
  const { examId } = useParams();
  const { currentUser } = useAuth();
  const [exam, setExam] = useState(null);
  const [starting, setStarting] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    mockApi.getExamById(examId).then((res) => setExam(res.data));
  }, [examId]);

  const handleStartExam = async () => {
    if (!agreed) return;
    setStarting(true);
    try {
      const res = await mockApi.startAttempt(examId, currentUser?.id);
      const attempt = res.data;
      navigate(`/exam/attempts/${attempt.id}`);
    } catch (e) {
      alert('Không thể khởi tạo lượt thi: ' + e.message);
      setStarting(false);
    }
  };

  if (!exam) return <div style={{ padding: '40px', textAlign: 'center' }}>Đang nạp phòng thi...</div>;

  return (
    <ManagementFrame className="management-screen" header={<span className="management-tab-active">Thông tin</span>} status={<strong>Chuẩn bị vào thi</strong>}><div className="management-body-scroll">
      <Card style={{ padding: '32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Badge variant="purple" size="md">Phòng chờ thi trực tuyến (Exam Lobby)</Badge>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--navy)', marginTop: '10px', marginBottom: '4px' }}>
            {exam.title}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--navy-muted)' }}>
            Mã ca thi: <strong>{exam.code}</strong> · Thí sinh: <strong>{currentUser?.name}</strong>
          </p>
        </div>

        {/* System readiness checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--surface-canvas)', padding: '16px 20px', borderRadius: '12px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
            <CheckCircle2 size={18} color="#059669" />
            <span>Xác thực danh tính thí sinh: <strong>{currentUser?.name} ({currentUser?.email})</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
            <CheckCircle2 size={18} color="#059669" />
            <span>Kết nối máy chủ & Đồng bộ đồng hồ: <strong>Chuẩn UTC+7 (Asia/Ho_Chi_Minh)</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
            <CheckCircle2 size={18} color="#059669" />
            <span>Cơ chế bảo vệ dữ liệu: <strong>Tự động lưu từng câu & Idempotent Submit kích hoạt</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
            <Clock size={18} color="var(--color-primary-600)" />
            <span>Thời gian làm bài: <strong>{exam.durationMinutes} phút</strong> (Bắt đầu tính ngay khi bấm nút)</span>
          </div>
        </div>

        {/* Agreement checkbox */}
        <div style={{ padding: '14px', border: '1px solid var(--line)', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            id="agree-rules"
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <label htmlFor="agree-rules" style={{ fontSize: '13px', color: 'var(--navy)', cursor: 'pointer' }}>
            Tôi cam kết làm bài trung thực, không gian lận và tuân thủ mọi quy chế khảo thí của SkillHub.
          </label>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button variant="ghost" icon={ArrowLeft} onClick={() => navigate(`/app/exams/${examId}`)}>
            Quay lại
          </Button>

          <Button
            variant="primary"
            size="lg"
            disabled={!agreed || starting}
            loading={starting}
            icon={ArrowRight}
            iconPosition="right"
            onClick={handleStartExam}
          >
            Bắt đầu làm bài thi ngay
          </Button>
        </div>
      </Card>
    </div></ManagementFrame>
  );
}
