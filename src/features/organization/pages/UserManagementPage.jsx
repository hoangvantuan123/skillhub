import ManagementList from '../../../shared/ui/ManagementList';
import React, { useState, useEffect } from 'react';

import Badge from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import Input from '../../../shared/ui/Input';
import Modal from '../../../shared/ui/Modal';
import { mockApi } from '../../../mocks/mockService';
import { useToast } from '../../../shared/hooks/useToast';
import { UserPlus, Award, CheckCircle2, Star, KeyRound, Copy, ExternalLink } from 'lucide-react';

export default function UserManagementPage() {
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [candidatesList, setCandidatesList] = useState([]);

  // Candidate provisioning form
  const [candName, setCandName] = useState('Đỗ Văn Hùng');
  const [candEmail, setCandEmail] = useState('hung.dv@skillhub.vn');
  const [candExam, setCandExam] = useState('EXAM-MES-2026-Q1');
  const [candGroup, setCandGroup] = useState('grp-mes');

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDepartment, setFormDepartment] = useState('Khối MES & Nhà máy Thông minh');
  const [formGroup, setFormGroup] = useState('grp-mes');
  const [formRank, setFormRank] = useState('Chuyên viên chính (Senior Engineer)');
  const [selectedRoles, setSelectedRoles] = useState(['learner']);

  useEffect(() => {
    loadData();
  }, [search, filterGroup]);

  const loadData = async () => {
    const [uRes, gRes] = await Promise.all([
      mockApi.getUsers({ search, groupId: filterGroup }),
      mockApi.getGroups(),
    ]);
    setUsers(uRes.data || []);
    setGroups(gRes.data || []);
  };

  const handleToggleRole = (roleKey) => {
    if (selectedRoles.includes(roleKey)) {
      if (selectedRoles.length === 1) return; // Keep at least one role
      setSelectedRoles(selectedRoles.filter((r) => r !== roleKey));
    } else {
      setSelectedRoles([...selectedRoles, roleKey]);
    }
  };

  const handleSelectFullAdmin = () => {
    setSelectedRoles(['learner', 'author', 'reviewer', 'exam_mgr', 'grader', 'admin']);
    setFormRank('Tổng Quản trị Hệ thống (Super Admin)');
    addToast('Đã chọn cấp toàn bộ 6 quyền hạn cho tài khoản!', 'info');
  };

  const handleCreateUser = async () => {
    if (!formName.trim() || !formEmail.trim()) {
      addToast('Vui lòng nhập họ tên và email hợp lệ!', 'warning');
      return;
    }

    await mockApi.createUser({
      name: formName,
      email: formEmail,
      department: formDepartment,
      unit: 'Tập đoàn Công nghệ SkillHub',
      rank: formRank,
      rankLevel: 3,
      roles: selectedRoles,
      assignedGroups: formGroup ? [formGroup] : [],
    });

    addToast(`Đã đăng ký tài khoản thành công cho: ${formName}`, 'success');
    setShowCreateModal(false);
    // Reset form
    setFormName('');
    setFormEmail('');
    setSelectedRoles(['learner']);
    loadData();
  };

  const loadCandidates = async () => {
    const res = await mockApi.getCandidates();
    setCandidatesList(res.data || []);
  };

  const handleOpenCandidateModal = async () => {
    await loadCandidates();
    setShowCandidateModal(true);
  };

  const handleIssuePasscode = async () => {
    if (!candName.trim() || !candEmail.trim()) {
      addToast('Vui lòng nhập họ tên và email thí sinh!', 'warning');
      return;
    }
    const res = await mockApi.issueCandidatePasscode({
      name: candName,
      email: candEmail,
      examId: candExam,
      group: candGroup,
    });
    addToast(`Đã cấp SBD: ${res.data.sbd} và Mã Passcode: ${res.data.passcode} cho thí sinh!`, 'success');
    await loadCandidates();
    loadData();
  };

  const roleLabels = {
    learner: { label: 'Người học', variant: 'default' },
    author: { label: 'Biên soạn', variant: 'purple' },
    reviewer: { label: 'Người duyệt', variant: 'warning' },
    exam_mgr: { label: 'Tổ chức thi', variant: 'info' },
    grader: { label: 'Chấm thi', variant: 'info' },
    admin: { label: 'Quản trị viên', variant: 'danger' },
  };

  const columns = [
    {
      title: 'Tài khoản & Email',
      key: 'name',
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#ffffff',
              display: 'grid',
              placeItems: 'center',
              fontWeight: '700',
              fontSize: '13px',
              flexShrink: 0,
            }}
          >
            {row.avatar || 'U'}
          </span>
          <div>
            <strong style={{ fontSize: '13px', color: 'var(--navy)', display: 'block' }}>{val}</strong>
            <small style={{ color: 'var(--navy-muted)' }}>{row.email}</small>
          </div>
        </div>
      ),
    },
    {
      title: 'Cấp bậc thăng tiến',
      key: 'rank',
      render: (val) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '600', color: 'var(--color-primary-700)' }}>
          <Award size={14} /> {val}
        </span>
      ),
    },
    {
      title: 'Các vai trò sở hữu (Multi-role)',
      key: 'roles',
      render: (roles) => (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {roles?.map((r) => (
            <Badge key={r} variant={roleLabels[r]?.variant || 'default'} size="sm">
              {roleLabels[r]?.label || r}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      title: 'Nhóm học / Lớp',
      key: 'assignedGroups',
      render: (gIds) => {
        if (!gIds || gIds.length === 0) return <span style={{ color: 'var(--navy-muted)', fontSize: '12px' }}>Chưa gán nhóm</span>;
        return (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {gIds.map((gid) => {
              const g = groups.find((item) => item.id === gid);
              return (
                <Badge key={gid} variant="info" size="sm">
                  {g ? g.code : gid}
                </Badge>
              );
            })}
          </div>
        );
      },
    },
    {
      title: 'Đơn vị',
      key: 'department',
      render: (val) => <span style={{ fontSize: '12px', color: 'var(--navy-muted)' }}>{val}</span>,
    },
  ];

  return (
    <>
<ManagementList title={"Quản lý Tài khoản & Phân quyền Người học"} actions={<div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="secondary" icon={KeyRound} onClick={handleOpenCandidateModal}>
              ⚡ Cấp SBD & Passcode Thi
            </Button>
            <Button variant="primary" icon={UserPlus} onClick={() => setShowCreateModal(true)}>
              Đăng ký người học / Tạo tài khoản mới
            </Button>
          </div>} columns={columns} data={users} searchPlaceholder={"Tìm kiếm theo tên tài khoản, email, đơn vị..."} />
<Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Đăng ký tài khoản & Phân quyền người học"
        size="xl"
        density="comfortable"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" icon={CheckCircle2} onClick={handleCreateUser}>
              Lưu & Kích hoạt tài khoản
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Họ và tên người học"
              placeholder="Ví dụ: Nguyễn Văn An"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
            <Input
              label="Email cơ quan"
              type="email"
              placeholder="an.nv@skillhub.vn"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--navy)', display: 'block', marginBottom: '6px' }}>
                Đơn vị / Phòng ban
              </label>
              <select
                value={formDepartment}
                onChange={(e) => setFormDepartment(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '14px' }}
              >
                <option value="Khối MES & Nhà máy Thông minh">Khối MES & Nhà máy Thông minh</option>
                <option value="Trung tâm Phát triển Phần mềm">Trung tâm Phát triển Phần mềm</option>
                <option value="Ban Đào tạo & Khảo thí">Ban Đào tạo & Khảo thí</option>
                <option value="Hội đồng Giám khảo & Khoa học">Hội đồng Giám khảo & Khoa học</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--navy)', display: 'block', marginBottom: '6px' }}>
                Gán vào Nhóm / Lớp học viên
              </label>
              <select
                value={formGroup}
                onChange={(e) => setFormGroup(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '14px' }}
              >
                <option value="">-- Chưa gán nhóm --</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--navy)', display: 'block', marginBottom: '6px' }}>
              Cấp bậc thăng tiến năng lực (Competency Tier)
            </label>
            <select
              value={formRank}
              onChange={(e) => setFormRank(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--line)', fontSize: '14px' }}
            >
              <option value="Sơ cấp / Fresher (Bậc 1)">Sơ cấp / Fresher (Bậc 1) - Tiếp cận kiến thức nền</option>
              <option value="Chuyên viên / Specialist (Bậc 2)">Chuyên viên / Specialist (Bậc 2) - Nắm vững quy trình</option>
              <option value="Chuyên viên chính (Senior Engineer)">Chuyên viên chính (Senior Engineer) - Giải quyết sự cố xưởng</option>
              <option value="Kỹ sư trưởng (Solution Architect)">Kỹ sư trưởng (Solution Architect) - Thiết kế kiến trúc ISA-95</option>
              <option value="Chuyên gia Cao cấp / MES Lead (Bậc 5)">Chuyên gia Cao cấp / MES Lead (Bậc 5) - Cố vấn chiến lược</option>
            </select>
          </div>

          {/* Multi-role selection */}
          <div style={{ background: 'var(--surface-canvas)', padding: '16px', borderRadius: '10px', border: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--navy)' }}>Phân quyền vai trò (1 người có nhiều vai trò)</strong>
                <p style={{ fontSize: '13px', color: 'var(--navy-muted)', margin: '2px 0 0' }}>Tích chọn các vai trò mà tài khoản được phép thực hiện trên hệ thống.</p>
              </div>
              <Button size="sm" variant="secondary" icon={Star} onClick={handleSelectFullAdmin}>
                Cấp Full Quyền
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'learner', title: 'Người học', desc: 'Vào thi, luyện tập, học bài' },
                { id: 'author', title: 'Người biên soạn', desc: 'Soạn học liệu, câu hỏi, bộ đề' },
                { id: 'reviewer', title: 'Người duyệt', desc: 'Duyệt câu hỏi, xuất bản đề' },
                { id: 'exam_mgr', title: 'Người tổ chức thi', desc: 'Tạo ca thi, lịch thi, giao nhóm' },
                { id: 'grader', title: 'Người chấm thi', desc: 'Chấm tự luận theo Rubric' },
                { id: 'admin', title: 'Quản trị viên', desc: 'Quản lý tài khoản, cấu hình hệ thống' },
              ].map((r) => {
                const isChecked = selectedRoles.includes(r.id);
                return (
                  <label
                    key={r.id}
                    onClick={() => handleToggleRole(r.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: isChecked ? '1.5px solid var(--color-primary-600)' : '1px solid var(--line)',
                      background: isChecked ? 'var(--color-primary-50)' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      style={{ marginTop: '2px', cursor: 'pointer' }}
                    />
                    <div>
                      <strong style={{ fontSize: '14px', color: 'var(--navy)', display: 'block' }}>{r.title}</strong>
                      <span style={{ fontSize: '13px', color: 'var(--navy-muted)' }}>{r.desc}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
<Modal
        open={showCandidateModal}
        onClose={() => setShowCandidateModal(false)}
        title="⚡ Cấp Tài Khoản & Mã Dự Thi (SBD & Passcode)"
        density="comfortable"
        width="880px"
        footer={
          <Button variant="outline" onClick={() => setShowCandidateModal(false)}>
            Đóng
          </Button>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Create Candidate Form */}
          <div style={{ background: 'var(--surface-subtle)', padding: '16px', borderRadius: '10px', border: '1px solid var(--line)' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--navy)', marginBottom: '12px' }}>
              Cấp Số Báo Danh (SBD) và Passcode vào thi cho thí sinh mới:
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '12px', marginBottom: '12px' }}>
              <Input label="Họ và tên thí sinh" value={candName} onChange={(e) => setCandName(e.target.value)} />
              <Input label="Email liên hệ" value={candEmail} onChange={(e) => setCandEmail(e.target.value)} />
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--navy)', display: 'block', marginBottom: '4px' }}>
                  Kỳ thi phân công
                </label>
                <select
                  value={candExam}
                  onChange={(e) => setCandExam(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '12px' }}
                >
                  <option value="EXAM-MES-2026-Q1">Kỳ thi Kỹ sư MES & Smart Factory 2026</option>
                  <option value="EXAM-ARCH-2026">Kỳ thi Kiến trúc Microservices & Idempotency</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--navy)', display: 'block', marginBottom: '4px' }}>
                  Nhóm học viên
                </label>
                <select
                  value={candGroup}
                  onChange={(e) => setCandGroup(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--line)', fontSize: '12px' }}
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="primary" icon={KeyRound} onClick={handleIssuePasscode}>
                Sinh mã SBD & Cấp Passcode
              </Button>
            </div>
          </div>

          {/* Candidate list with SBD */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--navy)' }}>
                Danh sách thí sinh có mã vào thi ({candidatesList.length} thí sinh):
              </h4>
              <a
                href="/exam-entry"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '12px', color: 'var(--color-primary-600)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                Mở Cổng Đăng Nhập Thi Thí Sinh (/exam-entry) <ExternalLink size={14} />
              </a>
            </div>

            <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--line)', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-subtle)', textAlign: 'left', borderBottom: '1px solid var(--line)' }}>
                    <th style={{ padding: '8px 12px' }}>Số Báo Danh (SBD)</th>
                    <th style={{ padding: '8px 12px' }}>Họ tên & Email</th>
                    <th style={{ padding: '8px 12px' }}>Mã Passcode ca thi</th>
                    <th style={{ padding: '8px 12px' }}>Kỳ thi</th>
                    <th style={{ padding: '8px 12px' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {candidatesList.map((c, idx) => (
                    <tr key={c.id || idx} style={{ borderBottom: '1px solid var(--line-subtle)' }}>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ fontWeight: '800', color: 'var(--color-primary-600)', fontFamily: 'monospace', fontSize: '13px' }}>
                          {c.sbd}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <strong>{c.name}</strong>
                        <div style={{ color: 'var(--navy-muted)', fontSize: '11px' }}>{c.email}</div>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ background: 'var(--surface-subtle)', border: '1px solid var(--line)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: '700' }}>
                          {c.passcode}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', color: 'var(--navy-muted)' }}>
                        {c.assignedExam}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={Copy}
                          onClick={() => {
                            navigator.clipboard?.writeText(`SBD: ${c.sbd} | Passcode: ${c.passcode} | Link: http://127.0.0.1:5174/exam-entry`);
                            addToast(`Đã copy thông tin thi của ${c.name} vào bộ nhớ tạm!`, 'success');
                          }}
                          title="Sao chép thông tin gửi thí sinh"
                        >
                          Copy
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>
</>
  );
}
