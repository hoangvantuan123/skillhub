import ManagementFrame from '../../../shared/ui/ManagementFrame';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Card from '../../../shared/ui/Card';
import Button from '../../../shared/ui/Button';
import Badge from '../../../shared/ui/Badge';
import { CheckCircle2, Home, Award } from 'lucide-react';
import { formatDate } from '../../../shared/lib/formatters';

export default function SubmissionReceiptPage() {
  const navigate = useNavigate();
  const { attemptId } = useParams();
  const [searchParams] = useSearchParams();
  const receiptNumber = searchParams.get('receipt') || 'RCPT-SKH-9281';

  return (
    <ManagementFrame className="management-screen" header={<span className="management-tab-active">Thông tin</span>} status={<strong>Kết quả nộp bài</strong>}><div className="management-body-scroll">
      <Card style={{ padding: '36px', textAlign: 'center' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--color-success-bg)',
            color: '#059669',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 18px',
          }}
        >
          <CheckCircle2 size={36} />
        </div>

        <Badge variant="success" size="md">Nộp bài thi thành công</Badge>

        <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--navy)', marginTop: '12px', marginBottom: '6px' }}>
          Biên nhận nộp bài thi chính thức
        </h1>

        <p style={{ fontSize: '13px', color: 'var(--navy-muted)', marginBottom: '24px' }}>
          Bài thi của bạn đã được ghi nhận trên máy chủ an toàn với khóa Idempotency Key duy nhất.
        </p>

        {/* Receipt Box */}
        <div style={{ background: 'var(--surface-canvas)', border: '1px dashed var(--line)', borderRadius: '12px', padding: '20px', textAlign: 'left', marginBottom: '28px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--navy-muted)' }}>Mã biên nhận:</span>
            <strong style={{ color: 'var(--color-primary-600)', fontFamily: 'monospace', fontSize: '14px' }}>{receiptNumber}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--navy-muted)' }}>Mã lượt thi (Attempt ID):</span>
            <span style={{ color: 'var(--navy)', fontFamily: 'monospace' }}>{attemptId}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--navy-muted)' }}>Thời gian máy chủ ghi nhận:</span>
            <strong style={{ color: 'var(--navy)' }}>{formatDate(new Date())}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--navy-muted)' }}>Trạng thái chấm:</span>
            <span style={{ color: 'var(--color-warning-text)', fontWeight: '600' }}>Chờ chấm tự luận & Công bố kết quả</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <Button variant="secondary" icon={Home} onClick={() => navigate('/app')}>
            Về trang tổng quan
          </Button>
          <Button variant="primary" icon={Award} onClick={() => navigate('/manage/reports')}>
            Xem lịch sử kết quả thi
          </Button>
        </div>
      </Card>
    </div></ManagementFrame>
  );
}
