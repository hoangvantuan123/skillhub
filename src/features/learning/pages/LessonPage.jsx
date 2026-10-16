import ManagementFrame from '../../../shared/ui/ManagementFrame';
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Card from '../../../shared/ui/Card';
import Button from '../../../shared/ui/Button';
import Badge from '../../../shared/ui/Badge';
import { mockApi } from '../../../mocks/mockService';
import { useToast } from '../../../shared/hooks/useToast';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function LessonPage() {
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams();
  const { addToast } = useToast();

  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);

  useEffect(() => {
    mockApi.getCourseById(courseId).then((res) => {
      const c = res.data;
      setCourse(c);
      const l = c.lessons.find((item) => item.id === lessonId) || c.lessons[0];
      setCurrentLesson(l);
    });
  }, [courseId, lessonId]);

  const handleMarkComplete = async () => {
    await mockApi.updateLessonProgress(courseId, currentLesson.id, true);
    addToast('Đã ghi nhận hoàn thành bài học!', 'success');

    // Reload course
    const res = await mockApi.getCourseById(courseId);
    setCourse(res.data);
    const updated = res.data.lessons.find((item) => item.id === currentLesson.id);
    setCurrentLesson(updated);
  };

  if (!course || !currentLesson) return <div>Đang nạp bài học...</div>;

  return (
    <ManagementFrame className="management-screen"
header={<><div className="management-tabs"><span className="management-tab-active">Chi tiết</span>{null}</div><div className="management-actions">{<Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate('/app/learning')}>
            Quay lại danh sách khóa học
          </Button>}{null}</div></>}

status={<><strong>{course.title}</strong></>}
>
<div className="management-body-scroll">
<div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '20px' }}>
        {/* Main Lesson Content */}
        <Card style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--line-subtle)', paddingBottom: '12px' }}>
            <Badge variant="purple">{currentLesson.duration}</Badge>
            {currentLesson.completed ? (
              <Badge variant="success">✓ Đã hoàn thành</Badge>
            ) : (
              <Badge variant="warning">Đang học</Badge>
            )}
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--navy)', marginBottom: '16px' }}>
            {currentLesson.title}
          </h2>

          <div style={{ fontSize: '14px', lineHeight: '1.7', color: 'var(--navy)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p>
              Chào mừng bạn đến với bài học chuyên sâu của hệ thống SkillHub. Kiến trúc phần mềm chuẩn mực luôn đòi hỏi việc phân tách rõ ràng ranh giới giữa các module (Domain Boundaries), áp dụng nguyên tắc Single Responsibility và bảo vệ dữ liệu với transaction ACID.
            </p>

            <div style={{ background: 'var(--surface-canvas)', border: '1px solid var(--line)', borderRadius: '10px', padding: '16px' }}>
              <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--color-primary-600)' }}>
                Quy tắc nghiệp vụ quan trọng:
              </strong>
              <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--navy)' }}>
                <li>Mỗi ca thi chỉ tham chiếu một phiên bản bộ đề bất biến.</li>
                <li>Trắc nghiệm do máy chủ chấm độc lập; không truyền đáp án đúng xuống client khi đang thi.</li>
                <li>Idempotency key đảm bảo nếu người học nộp nhiều lần do mất mạng vẫn trả về cùng biên nhận.</li>
              </ul>
            </div>

            <p>
              Khi làm bài thi hoặc ôn luyện, bạn nên đối chiếu trực tiếp với ngân hàng câu hỏi và kho tài liệu tra cứu đã được xuất bản để nắm vững các kịch bản thực tế.
            </p>
          </div>

          <div style={{ marginTop: '28px', borderTop: '1px solid var(--line-subtle)', paddingTop: '18px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            {!currentLesson.completed && (
              <Button variant="primary" icon={CheckCircle2} onClick={handleMarkComplete}>
                Đánh dấu đã hoàn thành bài học
              </Button>
            )}
          </div>
        </Card>

        {/* Lesson List Sidebar */}
        <div>
          <Card style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--navy)', marginBottom: '12px' }}>
              Danh sách bài học trong khóa
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {course.lessons.map((les, idx) => {
                const isActive = les.id === currentLesson.id;
                return (
                  <button
                    key={les.id}
                    onClick={() => navigate(`/app/learning/${course.id}/lessons/${les.id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: isActive ? '1.5px solid var(--color-primary-600)' : '1px solid var(--line)',
                      background: isActive ? 'var(--color-primary-50)' : '#ffffff',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '12px', color: 'var(--navy)', display: 'block' }}>
                        {les.title}
                      </strong>
                      <small style={{ color: 'var(--navy-muted)' }}>{les.duration}</small>
                    </div>
                    {les.completed && <CheckCircle2 size={16} color="#059669" />}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
</div>

</ManagementFrame>
  );
}
