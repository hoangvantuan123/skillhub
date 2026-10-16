import ManagementFrame from '../../../shared/ui/ManagementFrame';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../../shared/ui/Card';

import Button from '../../../shared/ui/Button';
import { mockApi } from '../../../mocks/mockService';
import { formatDate } from '../../../shared/lib/formatters';
import { ArrowLeft, ShieldCheck, Play } from 'lucide-react';

export default function ExamDetailPage() {
  const navigate = useNavigate();
  const { examId } = useParams();
  const [exam, setExam] = useState(null);

  useEffect(() => {
    mockApi.getExamById(examId).then((res) => setExam(res.data));
  }, [examId]);

  if (!exam) return <div>Đang tải thông tin kỳ thi...</div>;

  return (
    <ManagementFrame className="management-screen"
header={<><div className="management-tabs"><span className="management-tab-active">Chi tiết</span>{null}</div><div className="management-actions">{<Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate('/app/exams')}>
            Quay lại danh sách kỳ thi
          </Button>}{null}</div></>}

status={<><strong>{exam.title}</strong></>}
>
<div className="management-body-scroll">
<div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Conditions card */}
        <Card style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <ShieldCheck size={22} color="var(--color-primary-600)" />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--navy)' }}>
              Điều kiện & Quy chế tham gia ca thi
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: 'var(--navy)', lineHeight: '1.6' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ color: 'var(--color-primary-600)', fontWeight: '700' }}>1.</span>
              <span>
                <strong>Đối tượng tham gia:</strong> {exam.assignedGroups?.join(', ')}. Hệ thống đã xác thực tài khoản của bạn đủ điều kiện vào thi.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ color: 'var(--color-primary-600)', fontWeight: '700' }}>2.</span>
              <span>
                <strong>Thời lượng & Deadline tính giờ:</strong> Thời gian làm bài là <strong>{exam.durationMinutes} phút</strong>. Nếu bắt đầu gần hạn nộp cứng ({formatDate(exam.hardDeadline)}), thời gian làm bài thực tế sẽ tính bằng <code>min(bắt đầu + {exam.durationMinutes} phút, hạn nộp cứng)</code>.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ color: 'var(--color-primary-600)', fontWeight: '700' }}>3.</span>
              <span>
                <strong>Tự động lưu & Khôi phục mất mạng:</strong> Câu trả lời tự động lưu từng câu. Nếu mất mạng, trình duyệt sẽ lưu tạm cục bộ và tự động đồng bộ lại khi có kết nối trở lại trong thời hạn thi.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ color: 'var(--color-primary-600)', fontWeight: '700' }}>4.</span>
              <span>
                <strong>Chính sách tính điểm thi lại:</strong> Cho phép tối đa <strong>{exam.maxAttempts} lượt thi</strong>. Điểm chính thức áp dụng: <strong>{exam.retakePolicy === 'highest' ? 'Lấy điểm cao nhất' : 'Lấy điểm mới nhất'}</strong>.
              </span>
            </div>
          </div>
        </Card>

        {/* Action card to enter lobby / start */}
        <Card style={{ padding: '24px', background: 'var(--color-primary-50)', border: '1px solid var(--color-primary-200)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--color-primary-800)', marginBottom: '4px' }}>
                Sẵn sàng làm bài thi?
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--color-primary-700)', margin: 0 }}>
                Bạn sẽ được chuyển sang giao diện thi tập trung (ExamLayout). Vui lòng đảm bảo kết nối mạng ổn định.
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              icon={Play}
              onClick={() => navigate(`/app/exams/${exam.id}/lobby`)}
            >
              Vào phòng chờ thi (Lobby) →
            </Button>
          </div>
        </Card>
      </div>
</div>

</ManagementFrame>
  );
}
