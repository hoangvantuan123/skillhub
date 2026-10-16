import ManagementFrame from '../../../shared/ui/ManagementFrame';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/hooks/useAuth';
import { FilePlus2, Landmark, CalendarDays, BookOpen, Clock, ArrowRight, CheckCircle2, Award, AlertCircle, Dumbbell, ClipboardCheck } from 'lucide-react';
import Card from '../../../shared/ui/Card';
import Badge from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import { mockApi } from '../../../mocks/mockService';
import { formatDate } from '../../../shared/lib/formatters';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);

  useEffect(() => {
    mockApi.getCourses().then((res) => setCourses(res.data || []));
    mockApi.getExams().then((res) => setExams(res.data || []));
  }, []);

  // Role-specific action cards
  const getActionCards = () => {
    switch (currentUser?.role) {
      case 'author':
        return [
          { icon: FilePlus2, label: 'Soạn câu hỏi mới', path: '/manage/questions' },
          { icon: Landmark, label: 'Thiết lập ma trận đề', path: '/manage/assessments' },
          { icon: BookOpen, label: 'Quản lý khóa học', path: '/app/learning' },
          { icon: Dumbbell, label: 'Kiểm tra ngân hàng câu hỏi', path: '/manage/questions' },
        ];
      case 'reviewer':
        return [
          { icon: CheckCircle2, label: 'Duyệt câu hỏi chờ xuất bản', path: '/manage/questions' },
          { icon: Landmark, label: 'Thẩm định phiên bản đề', path: '/manage/assessments' },
          { icon: BookOpen, label: 'Kiểm duyệt học liệu', path: '/app/learning' },
        ];
      case 'grader':
        return [
          { icon: ClipboardCheck, label: 'Danh sách bài cần chấm', path: '/manage/grading' },
          { icon: Award, label: 'Chấm theo tiêu chí Rubric', path: '/manage/grading' },
          { icon: Landmark, label: 'Xem đáp án & biểu điểm', path: '/manage/assessments' },
        ];
      case 'exam_mgr':
        return [
          { icon: CalendarDays, label: 'Tổ chức ca thi mới', path: '/manage/exams' },
          { icon: Landmark, label: 'Giao nhóm & thành viên', path: '/manage/groups' },
          { icon: Award, label: 'Xem kết quả & Báo cáo', path: '/manage/reports' },
        ];
      case 'admin':
        return [
          { icon: Landmark, label: 'Cây danh mục & Chủ đề', path: '/admin/catalog' },
          { icon: FilePlus2, label: 'Tất cả câu hỏi & Bộ đề', path: '/manage/questions' },
          { icon: CalendarDays, label: 'Giám sát ca thi', path: '/manage/exams' },
          { icon: Award, label: 'Nhật ký kiểm toán', path: '/admin/settings' },
        ];
      default: // learner
        return [
          { icon: CalendarDays, label: 'Vào thi theo lịch', path: '/app/exams' },
          { icon: Dumbbell, label: 'Luyện tập theo chủ đề', path: '/app/practice' },
          { icon: BookOpen, label: 'Tiếp tục bài đang học', path: '/app/learning' },
          { icon: Landmark, label: 'Tra cứu kho kiến thức', path: '/app/knowledge' },
        ];
    }
  };

  return (
    <ManagementFrame className="management-screen" header={<span className="management-tab-active">Tổng quan</span>} status={<strong>Tổng quan</strong>}><div className="management-body-scroll">
      {/* Welcome Banner */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3"><h2 className="text-sm font-semibold">Xin chào, {currentUser?.name}</h2><p className="mt-1 text-xs text-slate-500">{currentUser?.unit} · {currentUser?.department}</p></div>

      {/* Quick Start Actions */}
      <section>
        <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', color: 'var(--navy)' }}>
          Thao tác nhanh
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
            gap: '14px',
          }}
        >
          {getActionCards().map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card
                key={idx}
                hoverable
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: 'var(--color-primary-50)',
                    color: 'var(--color-primary-600)',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={22} strokeWidth={1.8} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--navy)', lineHeight: '1.4' }}>
                  {item.label}
                </span>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Main Dashboard Grid: Việc cần làm & Khóa học đang học */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '20px' }}>
        {/* Việc cần làm (To-Do List) */}
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--color-primary-600)" />
              <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Việc cần làm hôm nay</h3>
            </div>
            <Badge variant="warning" size="sm">2 việc ưu tiên</Badge>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'var(--surface-canvas)',
                border: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <strong style={{ display: 'block', fontSize: '13px', color: 'var(--navy)' }}>
                  Kỳ thi Đánh giá Năng lực Kiến trúc Sư Quý 1/2026
                </strong>
                <span style={{ fontSize: '11px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <AlertCircle size={12} /> Hạn mở: 45 phút · Deadline cứng trước 17:30
                </span>
              </div>
              <Button size="sm" variant="primary" onClick={() => navigate('/app/exams/exam-1')}>
                Xem ca thi
              </Button>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'var(--surface-canvas)',
                border: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <strong style={{ display: 'block', fontSize: '13px', color: 'var(--navy)' }}>
                  Bài 4: Tự lưu bài thi, Offline Sync & Nộp bài an toàn
                </strong>
                <span style={{ fontSize: '11px', color: 'var(--navy-muted)', marginTop: '2px', display: 'block' }}>
                  Khóa học Kiến trúc Phần mềm Hiện đại · 75% hoàn thành
                </span>
              </div>
              <Button size="sm" variant="secondary" onClick={() => navigate('/app/learning/crs-1/lessons/les-4')}>
                Học tiếp
              </Button>
            </div>
          </div>
        </Card>

        {/* Khóa học đang học (Active Courses) */}
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={18} color="var(--color-primary-600)" />
              <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Tiến độ học tập</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/app/learning')}>
              Xem tất cả →
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {courses.slice(0, 2).map((course) => (
              <div key={course.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '13px', color: 'var(--navy)' }}>{course.title}</strong>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-primary-600)' }}>
                    {course.progress}%
                  </span>
                </div>
                {/* Progress bar */}
                <div style={{ height: '6px', background: 'var(--surface-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${course.progress}%`,
                      height: '100%',
                      background: 'var(--color-primary-600)',
                      borderRadius: '999px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--navy-muted)' }}>
                  <span>{course.category} · {course.level}</span>
                  <button
                    onClick={() => navigate(`/app/learning/${course.id}/lessons/${course.lessons[0].id}`)}
                    style={{ color: 'var(--color-primary-600)', fontWeight: '600', padding: 0 }}
                  >
                    Vào bài học →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Kỳ thi đang mở */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--navy)' }}>
            Kỳ thi được phân công tham gia
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/app/exams')}>
            Tất cả kỳ thi →
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '16px' }}>
          {exams.map((exam) => (
            <Card key={exam.id} hoverable style={{ padding: '18px' }} onClick={() => navigate(`/app/exams/${exam.id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <Badge variant="success" size="sm">{exam.statusLabel}</Badge>
                <span style={{ fontSize: '12px', color: 'var(--navy-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} /> {exam.durationMinutes} phút
                </span>
              </div>

              <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--navy)', marginBottom: '8px' }}>
                {exam.title}
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--navy-muted)', lineHeight: '1.5', marginBottom: '14px' }}>
                {exam.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--line-subtle)', paddingTop: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--navy-muted)' }}>
                  Hạn: {formatDate(exam.endTime, false)}
                </span>
                <Button size="sm" variant="secondary" icon={ArrowRight} iconPosition="right">
                  Chi tiết & Vào thi
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div></ManagementFrame>
  );
}
