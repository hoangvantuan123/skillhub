import ManagementList from '../../../shared/ui/ManagementList';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Badge from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import Input from '../../../shared/ui/Input';
import Modal from '../../../shared/ui/Modal';
import { mockApi } from '../../../mocks/mockService';
import { useToast } from '../../../shared/hooks/useToast';
import { Users, Plus, UserPlus, CheckCircle2 } from 'lucide-react';

export default function GroupsPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  // Modals
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [showAssignMemberModal, setShowAssignMemberModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Group Form state
  const [groupName, setGroupName] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [groupLeader, setGroupLeader] = useState('Hoàng Minh Tuấn');
  const [groupDesc, setGroupDesc] = useState('');

  // Member Assign state
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [gRes, uRes] = await Promise.all([mockApi.getGroups(), mockApi.getUsers()]);
    setGroups(gRes.data || []);
    setUsers(uRes.data || []);
  };

  const filtered = groups.filter(
    (g) => g.name.toLowerCase().includes(search.toLowerCase()) || g.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      addToast('Vui lòng nhập tên nhóm!', 'warning');
      return;
    }
    await mockApi.createGroup({
      name: groupName,
      code: groupCode || 'GRP-' + Math.floor(Math.random() * 1000),
      leader: groupLeader,
      description: groupDesc,
    });
    addToast('Đã tạo nhóm học viên mới thành công!', 'success');
    setShowAddGroupModal(false);
    setGroupName('');
    setGroupCode('');
    setGroupDesc('');
    loadData();
  };

  const handleAssignMember = async () => {
    if (!selectedUserId || !selectedGroup) {
      addToast('Vui lòng chọn học viên cần thêm vào nhóm!', 'warning');
      return;
    }
    await mockApi.assignUserToGroup(selectedUserId, selectedGroup.id);
    const user = users.find((u) => u.id === selectedUserId);
    addToast(`Đã thêm học viên "${user?.name}" vào nhóm ${selectedGroup.name}!`, 'success');
    setShowAssignMemberModal(false);
    loadData();
  };

  const columns = [
    {
      title: 'Mã nhóm / Lớp',
      key: 'code',
      render: (val) => <span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--color-primary-600)' }}>{val}</span>,
    },
    {
      title: 'Tên lớp & Nhóm học viên',
      key: 'name',
      render: (val, row) => (
        <div>
          <strong style={{ color: 'var(--navy)', fontSize: '13px' }}>{val}</strong>
          {row.description && <small style={{ display: 'block', color: 'var(--navy-muted)', marginTop: '2px' }}>{row.description}</small>}
        </div>
      ),
    },
    {
      title: 'Số thành viên',
      key: 'memberCount',
      render: (val) => (
        <Badge variant="purple">
          {val || 0} học viên
        </Badge>
      ),
    },
    {
      title: 'Phụ trách nhóm',
      key: 'leader',
      render: (val) => <span style={{ fontSize: '13px', color: 'var(--navy)' }}>{val}</span>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button
            size="sm"
            variant="secondary"
            icon={UserPlus}
            onClick={() => {
              setSelectedGroup(row);
              setShowAssignMemberModal(true);
            }}
          >
            Thêm học viên
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/admin/users')}
          >
            Xem danh sách
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
<ManagementList title={"Lớp học & Nhóm thành viên"} actions={<div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="outline" icon={Users} onClick={() => navigate('/admin/users')}>
              Quản lý tài khoản & Phân quyền
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => setShowAddGroupModal(true)}>
              Tạo nhóm mới
            </Button>
          </div>} columns={columns} data={groups} searchPlaceholder={"Tìm kiếm theo tên nhóm, mã lớp..."} />
<Modal
        open={showAddGroupModal}
        onClose={() => setShowAddGroupModal(false)}
        title="Tạo nhóm học viên / Lớp học mới"
        density="comfortable"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAddGroupModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" icon={CheckCircle2} onClick={handleCreateGroup}>
              Tạo nhóm
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input
            label="Tên nhóm / Lớp học"
            placeholder="Ví dụ: Nhóm Kỹ sư MES Nhà máy 2"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />
          <Input
            label="Mã định danh nhóm"
            placeholder="Ví dụ: MES-FACTORY-02"
            value={groupCode}
            onChange={(e) => setGroupCode(e.target.value)}
          />
          <Input
            label="Người phụ trách / Trưởng nhóm"
            value={groupLeader}
            onChange={(e) => setGroupLeader(e.target.value)}
          />
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--navy)', display: 'block', marginBottom: '6px' }}>
              Mô tả mục tiêu của nhóm
            </label>
            <textarea
              rows={3}
              value={groupDesc}
              onChange={(e) => setGroupDesc(e.target.value)}
              placeholder="Ghi chú về nhóm đối tượng tham gia, nhiệm vụ ôn tập..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                fontSize: '13px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </Modal>
<Modal
        open={showAssignMemberModal}
        onClose={() => setShowAssignMemberModal(false)}
        title={`Thêm học viên vào nhóm: ${selectedGroup?.name}`}
        density="comfortable"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAssignMemberModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" icon={UserPlus} onClick={handleAssignMember}>
              Thêm vào nhóm
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '13px', color: 'var(--navy-muted)', margin: 0 }}>
            Chọn tài khoản học viên để phân công vào nhóm <strong>{selectedGroup?.name}</strong>:
          </p>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--navy)', display: 'block', marginBottom: '6px' }}>
              Chọn học viên
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '13px' }}
            >
              <option value="">-- Chọn tài khoản --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email}) - {u.rank}
                </option>
              ))}
            </select>
          </div>

          <div style={{ padding: '12px', background: 'var(--surface-canvas)', borderRadius: '8px', fontSize: '12px', color: 'var(--navy-muted)' }}>
            💡 Bạn cũng có thể đăng ký tài khoản mới trực tiếp với đầy đủ các quyền tại trang{' '}
            <button
              onClick={() => {
                setShowAssignMemberModal(false);
                navigate('/admin/users');
              }}
              style={{ color: 'var(--color-primary-600)', fontWeight: '700', padding: 0 }}
            >
              Quản lý tài khoản & Phân quyền →
            </button>
          </div>
        </div>
      </Modal>
</>
  );
}
