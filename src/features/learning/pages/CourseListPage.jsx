import ManagementFrame from '../../../shared/ui/ManagementFrame';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchFilter from '../../../shared/components/SearchFilter';
import Card from '../../../shared/ui/Card';
import Button from '../../../shared/ui/Button';
import Badge from '../../../shared/ui/Badge';
import { mockApi } from '../../../mocks/mockService';
import { Clock, ArrowRight } from 'lucide-react';

export default function CourseListPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    mockApi.getCourses().then((res) => setCourses(res.data || []));
  }, []);

  const filtered = courses.filter(
    (c) => c.title.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ManagementFrame className="management-screen"
header={<><div className="management-tabs"><span className="management-tab-active">Danh sách</span>{null}</div><div className="management-actions">{null}{null}</div></>}
filters={<SearchFilter
        searchValue={search}
        onSearchChange={setSearch}
        placeholder="Tìm kiếm khóa học theo tên, danh mục..."
      />}
status={<><strong>{"Khóa học & Học liệu chuyên môn"}</strong><span>Tổng số: {courses.length}</span></>}
>
<div className="management-body-scroll">
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '20px' }}>
        {filtered.map((course) => (
          <Card key={course.id} hoverable style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <Badge variant="info">{course.category}</Badge>
              <span style={{ fontSize: '11px', color: 'var(--navy-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} /> {course.durationHours} giờ học
              </span>
            </div>

            <h3 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--navy)', marginBottom: '8px', lineHeight: '1.4' }}>
              {course.title}
            </h3>

            <p style={{ fontSize: '12px', color: 'var(--navy-muted)', lineHeight: '1.6', marginBottom: '16px' }}>
              {course.description}
            </p>

            {/* Progress */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--navy-muted)' }}>Tiến độ</span>
                <strong style={{ color: 'var(--color-primary-600)' }}>{course.progress}%</strong>
              </div>
              <div style={{ height: '6px', background: 'var(--surface-subtle)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${course.progress}%`, height: '100%', background: 'var(--color-primary-600)', borderRadius: '999px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line-subtle)', paddingTop: '12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--navy-muted)' }}>
                {course.lessons?.length} bài học
              </span>
              <Button
                size="sm"
                variant="primary"
                icon={ArrowRight}
                iconPosition="right"
                onClick={() => navigate(`/app/learning/${course.id}/lessons/${course.lessons[0].id}`)}
              >
                Vào học ngay
              </Button>
            </div>
          </Card>
        ))}
      </div>
</div>

</ManagementFrame>
  );
}
