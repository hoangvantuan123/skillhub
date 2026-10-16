import React, { useState, useEffect } from 'react';
import PageHeader from '../../../shared/components/PageHeader';
import Card from '../../../shared/ui/Card';
import Badge from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import { mockApi } from '../../../mocks/mockService';
import { useToast } from '../../../shared/hooks/useToast';
import { Bell, CheckCheck, Clock } from 'lucide-react';

export default function NotificationsPage() {
  const { addToast } = useToast();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    mockApi.getNotifications().then((res) => setNotifications(res.data || []));
  }, []);

  const handleMarkAllRead = async () => {
    const res = await mockApi.markAllNotificationsAsRead();
    setNotifications(res.data || []);
    addToast('Đã đánh dấu tất cả thông báo là đã đọc.', 'success');
  };

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto' }}>
      <PageHeader
        title="Trung tâm thông báo"
        subtitle="Thông báo nhắc lịch thi, kết quả chấm thi và tiến trình phê duyệt nội dung."
        actions={
          <Button variant="outline" icon={CheckCheck} onClick={handleMarkAllRead}>
            Đánh dấu tất cả đã đọc
          </Button>
        }
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {notifications.map((n) => (
          <Card
            key={n.id}
            style={{
              padding: '16px 20px',
              borderLeft: n.read ? '3px solid var(--line)' : '3px solid var(--color-primary-600)',
              background: n.read ? '#ffffff' : 'var(--color-primary-50)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ fontSize: '14px', color: 'var(--navy)' }}>{n.title}</strong>
                {!n.read && <Badge variant="danger" size="sm">Mới</Badge>}
              </div>
              <span style={{ fontSize: '11px', color: 'var(--navy-muted)' }}>{n.time}</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--navy)', margin: 0, lineHeight: '1.5' }}>
              {n.message}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
