import ManagementFrame from '../../../shared/ui/ManagementFrame';
import React, { useState } from 'react';
import Card from '../../../shared/ui/Card';
import Badge from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import Tabs from '../../../shared/ui/Tabs';
import { mockSubjects, mockTopics } from '../../../mocks/mockData';
import { Plus, FolderTree } from 'lucide-react';

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState('subjects');
  const [subjects, setSubjects] = useState(mockSubjects);
  const [topics, setTopics] = useState(mockTopics);

  const tabs = [
    { id: 'subjects', label: 'Chuyên môn (Subjects)' },
    { id: 'topics', label: 'Cây chủ đề (Topics Tree)' },
    { id: 'levels', label: 'Cấp độ năng lực (Levels)' },
  ];

  return (
    <ManagementFrame className="management-screen"
header={<><div className="management-tabs"><Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />{null}</div><div className="management-actions">{null}{<Button variant="primary" icon={Plus} onClick={() => alert('Thêm danh mục mới')}>
            Thêm danh mục
          </Button>}</div></>}

status={<><strong>{"Danh mục chuyên môn & Khung năng lực"}</strong></>}
>
<div className="management-body-scroll">
{activeTab === 'subjects' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
          {subjects.map((s) => (
            <Card key={s.id} hoverable style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: '700', color: 'var(--color-primary-600)' }}>
                  {s.code}
                </span>
                <Badge variant="purple">{s.topicCount} chủ đề</Badge>
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--navy)', marginBottom: '8px' }}>
                {s.name}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--navy-muted)', margin: 0 }}>
                {s.questionCount} câu hỏi chuẩn hóa trong ngân hàng
              </p>
            </Card>
          ))}
        </div>
      )}
{activeTab === 'topics' && (
        <Card style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', color: 'var(--navy)' }}>
            Danh sách chủ đề liên kết ID
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topics.map((t) => {
              const parentSub = subjects.find((s) => s.id === t.subjectId);
              return (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: 'var(--surface-canvas)',
                    border: '1px solid var(--line)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FolderTree size={18} color="var(--color-primary-600)" />
                    <div>
                      <strong style={{ fontSize: '13px', color: 'var(--navy)', display: 'block' }}>{t.name}</strong>
                      <small style={{ color: 'var(--navy-muted)' }}>Chuyên môn: {parentSub?.name} · ID: {t.id}</small>
                    </div>
                  </div>
                  <Badge variant="info">{t.level}</Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}
{activeTab === 'levels' && (
        <Card style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', color: 'var(--navy)' }}>
            Phân định 4 mức độ nhận thức (Bloom Taxonomy)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '14px' }}>
            <div style={{ padding: '16px', borderRadius: '10px', background: 'var(--surface-canvas)', border: '1px solid var(--line)' }}>
              <Badge variant="default">Cấp độ 1</Badge>
              <h4 style={{ margin: '8px 0 4px', fontSize: '14px' }}>Nhận biết (Knowledge)</h4>
              <p style={{ fontSize: '12px', color: 'var(--navy-muted)', margin: 0 }}>Ghi nhớ, nhận diện các định nghĩa và thuật ngữ cốt lõi.</p>
            </div>
            <div style={{ padding: '16px', borderRadius: '10px', background: 'var(--surface-canvas)', border: '1px solid var(--line)' }}>
              <Badge variant="info">Cấp độ 2</Badge>
              <h4 style={{ margin: '8px 0 4px', fontSize: '14px' }}>Thông hiểu (Comprehension)</h4>
              <p style={{ fontSize: '12px', color: 'var(--navy-muted)', margin: 0 }}>Giải thích bản chất, so sánh các giải pháp kỹ thuật.</p>
            </div>
            <div style={{ padding: '16px', borderRadius: '10px', background: 'var(--surface-canvas)', border: '1px solid var(--line)' }}>
              <Badge variant="warning">Cấp độ 3</Badge>
              <h4 style={{ margin: '8px 0 4px', fontSize: '14px' }}>Vận dụng (Application)</h4>
              <p style={{ fontSize: '12px', color: 'var(--navy-muted)', margin: 0 }}>Áp dụng quy tắc vào kịch bản hệ thống cụ thể.</p>
            </div>
            <div style={{ padding: '16px', borderRadius: '10px', background: 'var(--surface-canvas)', border: '1px solid var(--line)' }}>
              <Badge variant="danger">Cấp độ 4</Badge>
              <h4 style={{ margin: '8px 0 4px', fontSize: '14px' }}>Vận dụng cao (Analysis)</h4>
              <p style={{ fontSize: '12px', color: 'var(--navy-muted)', margin: 0 }}>Phân tích kiến trúc phức tạp, thiết kế giải pháp và rubric.</p>
            </div>
          </div>
        </Card>
      )}
</div>

</ManagementFrame>
  );
}
