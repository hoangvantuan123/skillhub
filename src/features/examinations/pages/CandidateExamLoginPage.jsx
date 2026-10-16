import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../../shared/ui/Card';
import Input from '../../../shared/ui/Input';
import Button from '../../../shared/ui/Button';
import Badge from '../../../shared/ui/Badge';
import { mockApi } from '../../../mocks/mockService';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useToast } from '../../../shared/hooks/useToast';
import {
  LogIn,
  KeyRound,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  ClipboardCheck,
} from 'lucide-react';

export default function CandidateExamLoginPage() {
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();
  const { addToast } = useToast();

  const [sbd, setSbd] = useState('tuan.hm@skillhub.vn');
  const [passcode, setPasscode] = useState('PASS-8001');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFillDemo = (sampleSbd, samplePass) => {
    setSbd(sampleSbd);
    setPasscode(samplePass);
    setErrorMsg('');
  };

  const handleLoginExam = async (e) => {
    e?.preventDefault();
    if (!sbd.trim()) {
      setErrorMsg('Vui lòng nhập Số Báo Danh (SBD) hoặc Email thí sinh!');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await mockApi.verifyCandidatePasscode(sbd, passcode);
      const { user, examId } = res.data;

      // Log in candidate
      await mockApi.switchRole(user.role);
      addToast(`Xác thực thành công! Chào mừng thí sinh: ${user.name}`, 'success');

      // Navigate to candidate exams lobby
      navigate('/exams');
    } catch (err) {
      setErrorMsg(err.message || 'Mã đăng nhập hoặc Số Báo Danh không hợp lệ!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <Card style={{ maxWidth: '520px', width: '100%', padding: '36px', boxShadow: '0 20px 40px -15px rgba(0,0,0,0.15)' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', color: '#ffffff', display: 'grid', placeItems: 'center', margin: '0 auto 16px', boxShadow: '0 8px 20px rgba(37,99,235,0.35)' }}>
            <ClipboardCheck size={30} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--navy)', marginBottom: '8px' }}>
            Cổng Đăng nhập & Vào Thi Đánh giá
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--navy-muted)', margin: 0, lineHeight: '1.5' }}>
            Dành cho thí sinh dự thi đánh giá năng lực chuẩn hóa MES & Kiến trúc hệ thống.
          </p>
        </div>

        {/* Demo Fast-track Pill */}
        <div style={{ background: 'var(--color-primary-50)', border: '1px solid var(--color-primary-200)', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: 'var(--color-primary-700)', marginBottom: '8px' }}>
            <Sparkles size={16} /> Thử nhanh thông tin thí sinh mẫu:
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleFillDemo('tuan.hm@skillhub.vn', 'PASS-8001')}
              style={{
                fontSize: '11px',
                padding: '5px 10px',
                borderRadius: '6px',
                background: '#ffffff',
                border: '1px solid var(--color-primary-300)',
                color: 'var(--color-primary-700)',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Kỹ sư Hoàng Minh Tuấn (Senior MES)
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('quan.tm@skillhub.vn', 'PASS-8891')}
              style={{
                fontSize: '11px',
                padding: '5px 10px',
                borderRadius: '6px',
                background: '#ffffff',
                border: '1px solid var(--color-primary-300)',
                color: 'var(--color-primary-700)',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Kỹ sư Trần Minh Quân (Lead MES)
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLoginExam} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--navy)', display: 'block', marginBottom: '6px' }}>
              Số Báo Danh (SBD) hoặc Email thí sinh:
            </label>
            <input
              type="text"
              required
              value={sbd}
              onChange={(e) => setSbd(e.target.value)}
              placeholder="VD: SBD-MES-202601 hoặc email@skillhub.vn"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                fontSize: '13px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--navy)', display: 'block', marginBottom: '6px' }}>
              Mã Đăng Nhập / Passcode ca thi:
            </label>
            <input
              type="password"
              required
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="VD: PASS-8001"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                fontSize: '13px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          {errorMsg && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: '#b91c1c', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <Button
            variant="primary"
            type="submit"
            loading={loading}
            icon={ArrowRight}
            iconPosition="right"
            style={{ width: '100%', padding: '12px', marginTop: '8px', fontSize: '14px', fontWeight: '800' }}
          >
            Vào phòng thi ngay
          </Button>
        </form>

        {/* Footer info */}
        <div style={{ textAlign: 'center', borderTop: '1px solid var(--line-subtle)', paddingTop: '16px', marginTop: '24px', fontSize: '12px', color: 'var(--navy-muted)' }}>
          Hệ thống giám sát thi tự động · Yêu cầu camera & kết nối mạng ổn định
        </div>
      </Card>
    </div>
  );
}
