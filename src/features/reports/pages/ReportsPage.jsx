import ManagementFrame from '../../../shared/ui/ManagementFrame';
import React, { useState } from 'react';
import Card from '../../../shared/ui/Card';
import Badge from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import Tabs from '../../../shared/ui/Tabs';
import { Download } from 'lucide-react';
import { useAuth } from '../../../shared/hooks/useAuth';

export default function ReportsPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('personal'); // 'personal' | 'group' | 'topics'

  const personalAttempts = [
    {
      id: 'att-202',
      examTitle: 'Kiểm tra Chuẩn Đầu ra Kỹ thuật Frontend React 19',
      score: 8.5,
      maxScore: 10,
      status: 'Đạt chuẩn',
      date: '14/03/2026',
      receipt: 'RCPT-FE-1092',
    },
    {
      id: 'att-101',
      examTitle: 'Kỳ thi Đánh giá Năng lực Kiến trúc Sư Quý 1/2026',
      score: 9.0,
      maxScore: 10,
      status: 'Xuất sắc',
      date: '16/03/2026',
      receipt: 'RCPT-ARCH-4421',
    },
  ];

  const topicMastery = [
    { name: 'Clean Architecture & Modular Monolith', mastery: 90, status: 'Thành thạo', questionsCount: 8 },
    { name: 'Idempotency & Transaction Rules', mastery: 85, status: 'Thành thạo', questionsCount: 6 },
    { name: 'React 19 State & Concurrent Mode', mastery: 80, status: 'Đạt yêu cầu', questionsCount: 10 },
    { name: 'OAuth2, JWT & HttpOnly Session Cookies', mastery: 65, status: 'Cần củng cố', questionsCount: 5 },
    { name: 'Docker, CI/CD Pipeline & Health Check', mastery: 45, status: 'Chưa đạt', questionsCount: 4 },
  ];

  const tabs = [
    { id: 'personal', label: 'Kết quả cá nhân' },
    { id: 'topics', label: 'Phân tích năng lực theo chủ đề' },
    { id: 'group', label: 'Báo cáo phổ điểm đơn vị' },
  ];

  return (
    <ManagementFrame className="management-screen"
header={<><div className="management-tabs"><Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />{null}</div><div className="management-actions">{null}{<Button variant="outline" icon={Download} onClick={() => alert('Đang xuất báo cáo định dạng PDF/CSV...')}>
            Xuất báo cáo (CSV)
          </Button>}</div></>}

status={<><strong>{"Kết quả thi & Báo cáo năng lực"}</strong></>}
>
<div className="management-body-scroll">
{activeTab === 'personal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {personalAttempts.map((att) => (
            <Card key={att.id} style={{ padding: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--navy)' }}>{att.examTitle}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--navy-muted)' }}>Mã biên nhận: {att.receipt} · Ngày thi: {att.date}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--color-primary-600)' }}>
                    {att.score} / {att.maxScore}
                  </div>
                  <Badge variant="success" size="sm">{att.status}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
{activeTab === 'topics' && (
        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', color: 'var(--navy)' }}>
            Mức độ thành thạo theo từng chủ đề kiến thức
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {topicMastery.map((t, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ fontWeight: '600', color: 'var(--navy)' }}>{t.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--navy-muted)' }}>({t.questionsCount} câu hỏi đã làm)</span>
                    <Badge variant={t.mastery >= 80 ? 'success' : t.mastery >= 60 ? 'warning' : 'danger'}>
                      {t.status} ({t.mastery}%)
                    </Badge>
                  </div>
                </div>
                <div style={{ height: '8px', background: 'var(--surface-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${t.mastery}%`,
                      height: '100%',
                      background: t.mastery >= 80 ? '#059669' : t.mastery >= 60 ? '#d97706' : '#dc2626',
                      borderRadius: '999px',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
{activeTab === 'group' && (
        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px', color: 'var(--navy)' }}>
            Phổ điểm chung của đơn vị ({currentUser?.unit})
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--navy-muted)', marginBottom: '20px' }}>
            Tổng số thí sinh tham gia: 52 · Điểm trung bình: 8.2/10 · Tỷ lệ đạt chuẩn: 94%
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', textAlign: 'center' }}>
            <div style={{ padding: '16px', background: 'var(--surface-canvas)', borderRadius: '10px' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-primary-600)' }}>18</div>
              <div style={{ fontSize: '12px', color: 'var(--navy-muted)' }}>Xuất sắc (9.0 - 10)</div>
            </div>
            <div style={{ padding: '16px', background: 'var(--surface-canvas)', borderRadius: '10px' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669' }}>22</div>
              <div style={{ fontSize: '12px', color: 'var(--navy-muted)' }}>Giỏi (8.0 - 8.9)</div>
            </div>
            <div style={{ padding: '16px', background: 'var(--surface-canvas)', borderRadius: '10px' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#d97706' }}>9</div>
              <div style={{ fontSize: '12px', color: 'var(--navy-muted)' }}>Khá (6.5 - 7.9)</div>
            </div>
            <div style={{ padding: '16px', background: 'var(--surface-canvas)', borderRadius: '10px' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#dc2626' }}>3</div>
              <div style={{ fontSize: '12px', color: 'var(--navy-muted)' }}>Cần bồi dưỡng (&lt; 6.5)</div>
            </div>
          </div>
        </Card>
      )}
</div>

</ManagementFrame>
  );
}
