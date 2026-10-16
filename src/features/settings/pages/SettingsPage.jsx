import ManagementFrame from '../../../shared/ui/ManagementFrame';
import React, { useState, useEffect } from 'react';
import Card from '../../../shared/ui/Card';
import Input from '../../../shared/ui/Input';
import Button from '../../../shared/ui/Button';
import Badge from '../../../shared/ui/Badge';
import Tabs from '../../../shared/ui/Tabs';
import Table from '../../../shared/ui/Table';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useToast } from '../../../shared/hooks/useToast';
import { mockApi } from '../../../mocks/mockService';
import { formatDate } from '../../../shared/lib/formatters';


export default function SettingsPage() {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [auditLogs, setAuditLogs] = useState([]);
  const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh');

  useEffect(() => {
    mockApi.getAuditLogs().then((res) => setAuditLogs(res.data || []));
  }, []);

  const tabs = [
    { id: 'profile', label: 'Hồ sơ cá nhân' },
    { id: 'org', label: 'Cấu hình hệ thống & Múi giờ' },
    { id: 'audit', label: 'Nhật ký kiểm toán (Audit Logs)' },
  ];

  const auditColumns = [
    {
      title: 'Thời gian',
      key: 'timestamp',
      render: (val) => formatDate(val),
    },
    {
      title: 'Người thực hiện',
      key: 'actor',
      render: (val) => <strong style={{ color: 'var(--navy)' }}>{val}</strong>,
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (val) => <Badge variant="info">{val}</Badge>,
    },
    {
      title: 'Chi tiết thay đổi',
      key: 'details',
    },
    {
      title: 'IP',
      key: 'ip',
      render: (val) => <code style={{ fontSize: '11px' }}>{val}</code>,
    },
  ];

  return (
    <ManagementFrame className="management-screen"
header={<><div className="management-tabs"><Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />{null}</div><div className="management-actions">{null}{null}</div></>}

status={<><strong>{"Cài đặt & Nhật ký kiểm toán"}</strong></>}
>
<div className="management-body-scroll">
{activeTab === 'profile' && (
        <Card style={{ padding: '24px', maxWidth: '640px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', color: 'var(--navy)' }}>
            Thông tin người dùng hiện tại
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Input label="Họ và tên" defaultValue={currentUser?.name} />
            <Input label="Email công việc" defaultValue={currentUser?.email} disabled />
            <Input label="Đơn vị / Phòng ban" defaultValue={currentUser?.department} disabled />
            <Input label="Phạm vi ủy quyền" defaultValue={currentUser?.unit} disabled />

            <div style={{ marginTop: '10px' }}>
              <Button variant="primary" onClick={() => addToast('Đã lưu thông tin hồ sơ!', 'success')}>
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </Card>
      )}
{activeTab === 'org' && (
        <Card style={{ padding: '24px', maxWidth: '640px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', color: 'var(--navy)' }}>
            Thiết lập thời gian & Chuẩn tổ chức
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                Múi giờ hiển thị mặc định
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--line)' }}
              >
                <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (UTC+07:00 - Giờ Việt Nam)</option>
                <option value="UTC">UTC (Giờ phối hợp quốc tế)</option>
              </select>
            </div>

            <div style={{ background: 'var(--surface-canvas)', padding: '14px', borderRadius: '8px', fontSize: '12px', color: 'var(--navy-muted)', lineHeight: '1.5' }}>
              💡 <strong>Lưu ý kiến trúc:</strong> Toàn bộ thời gian (mở thi, hạn nộp, lượt làm) đều được lưu trữ theo chuẩn UTC ISO 8601 trên cơ sở dữ liệu và chỉ convert sang múi giờ hiển thị tại giao diện.
            </div>

            <Button variant="primary" onClick={() => addToast('Đã cập nhật cấu hình hệ thống!', 'success')}>
              Cập nhật cấu hình
            </Button>
          </div>
        </Card>
      )}
{activeTab === 'audit' && (
        <Card style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line-subtle)' }}>
            <strong style={{ fontSize: '14px', color: 'var(--navy)' }}>
              Nhật ký kiểm toán an toàn (Audit Trail)
            </strong>
            <p style={{ fontSize: '12px', color: 'var(--navy-muted)', margin: '4px 0 0' }}>
              Ghi nhận mọi thao tác nhạy cảm: chốt điểm, mở ca thi, xuất bản đề và cấu hình phân quyền.
            </p>
          </div>
          <Table columns={auditColumns} data={auditLogs} />
        </Card>
      )}
</div>

</ManagementFrame>
  );
}
