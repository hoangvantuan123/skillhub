import React from 'react';
import { Layers, SlidersHorizontal, Sparkles } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

export default function HelpDialog({ open, onClose }) {
  const steps = [
    {
      icon: Layers,
      title: 'Học tập & Ngân hàng câu hỏi',
      desc: 'Học bài theo lộ trình, biên soạn câu hỏi đa dạng (trắc nghiệm, tự luận, rubric) có quản lý phiên bản bất biến.',
    },
    {
      icon: SlidersHorizontal,
      title: 'Tổ chức thi & Làm bài an toàn',
      desc: 'Tạo ca thi, cấu hình hạn nộp cứng, tự động lưu bài thi theo từng câu và nộp bài idempotent chống trùng lặp.',
    },
    {
      icon: Sparkles,
      title: 'Chấm điểm rubric & Báo cáo năng lực',
      desc: 'Giám khảo chấm tự luận theo tiêu chí rubric minh bạch, phân tích phổ điểm và phát hiện chủ đề cần học bổ sung.',
    },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Giới thiệu hệ thống SkillHub"
      maxWidth="560px"
      footer={
        <Button variant="primary" onClick={onClose}>
          Đã hiểu, tiếp tục
        </Button>
      }
    >
      <p style={{ color: 'var(--navy-muted)', fontSize: '13px', lineHeight: '1.6', marginBottom: '20px' }}>
        SkillHub là nền tảng kết nối toàn diện: <strong>Học tập → Tra cứu → Luyện tập → Thi theo lịch → Chấm điểm → Học bổ sung</strong>.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={idx} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'var(--color-primary-50)',
                  color: 'var(--color-primary-600)',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={20} strokeWidth={1.8} />
              </div>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--navy)', marginBottom: '3px' }}>
                  {step.title}
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--navy-muted)', margin: 0, lineHeight: '1.5' }}>
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: '22px',
          padding: '12px 14px',
          background: 'var(--surface-subtle)',
          borderRadius: '8px',
          fontSize: '12px',
          color: 'var(--navy-muted)',
          lineHeight: '1.5',
        }}
      >
        💡 <strong>Mẹo thử nghiệm:</strong> Bạn có thể bấm vào tên tài khoản ở góc trên bên phải để chuyển đổi giữa 6 vai trò (Người học, Biên soạn, Duyệt, Tổ chức, Người chấm, Admin) để trải nghiệm đầy đủ các phân hệ.
      </div>
    </Modal>
  );
}
