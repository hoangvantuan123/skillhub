import ManagementFrame from '../../../shared/ui/ManagementFrame';
import React, { useState, useEffect } from 'react';
import SearchFilter from '../../../shared/components/SearchFilter';
import Card from '../../../shared/ui/Card';
import Badge from '../../../shared/ui/Badge';

import Tabs from '../../../shared/ui/Tabs';
import { mockApi } from '../../../mocks/mockService';
import { useToast } from '../../../shared/hooks/useToast';
import { Bookmark, BookmarkCheck } from 'lucide-react';

export default function KnowledgePage() {
  const { addToast } = useToast();
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'saved'
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    loadArticles();
  }, [search]);

  const loadArticles = async () => {
    const res = await mockApi.getArticles({ search });
    setArticles(res.data || []);
  };

  const handleToggleBookmark = async (artId) => {
    const res = await mockApi.toggleSaveArticle(artId);
    if (res.data) {
      addToast(res.data.saved ? 'Đã lưu tài liệu vào mục yêu thích!' : 'Đã bỏ lưu tài liệu.', 'info');
      loadArticles();
    }
  };

  const filtered = articles.filter((a) => (activeTab === 'saved' ? a.saved : true));

  const tabs = [
    { id: 'all', label: 'Tất cả tài liệu' },
    { id: 'saved', label: 'Tài liệu đã lưu' },
  ];

  return (
    <ManagementFrame className="management-screen"
header={<><div className="management-tabs"><Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />{null}</div><div className="management-actions">{null}{null}</div></>}
filters={<SearchFilter
        searchValue={search}
        onSearchChange={setSearch}
        placeholder="Tra cứu bài viết theo tiêu đề, từ khóa, tag..."
      />}
status={<><strong>{"Kho tài liệu & Tra cứu kiến thức"}</strong></>}
>
<div className="management-body-scroll">
<div style={{ display: 'grid', gridTemplateColumns: selectedArticle ? '1fr 1fr' : '1fr', gap: '20px' }}>
        {/* Article Cards Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filtered.length === 0 ? (
            <Card style={{ padding: '40px', textAlign: 'center', color: 'var(--navy-muted)' }}>
              Không tìm thấy tài liệu phù hợp.
            </Card>
          ) : (
            filtered.map((art) => (
              <Card
                key={art.id}
                hoverable
                onClick={() => setSelectedArticle(art)}
                style={{
                  padding: '20px',
                  border: selectedArticle?.id === art.id ? '2px solid var(--color-primary-600)' : '1px solid var(--line)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <Badge variant="info">{art.subject}</Badge>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleBookmark(art.id);
                    }}
                    style={{ color: art.saved ? 'var(--color-primary-600)' : 'var(--navy-muted)', padding: '4px' }}
                    title={art.saved ? 'Bỏ lưu' : 'Lưu tài liệu'}
                  >
                    {art.saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                  </button>
                </div>

                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--navy)', marginBottom: '8px' }}>
                  {art.title}
                </h3>

                <p style={{ fontSize: '12px', color: 'var(--navy-muted)', lineHeight: '1.6', marginBottom: '14px' }}>
                  {art.summary}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--navy-muted)', borderTop: '1px solid var(--line-subtle)', paddingTop: '10px' }}>
                  <span>Tác giả: <strong>{art.author}</strong></span>
                  <span>{art.readTime} · {art.date}</span>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Article Detail View */}
        {selectedArticle && (
          <Card style={{ padding: '28px', position: 'sticky', top: '80px', height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <Badge variant="purple">{selectedArticle.subject}</Badge>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--navy)', marginTop: '8px' }}>
                  {selectedArticle.title}
                </h2>
                <div style={{ fontSize: '12px', color: 'var(--navy-muted)', marginTop: '4px' }}>
                  Tác giả: {selectedArticle.author} · {selectedArticle.date}
                </div>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                style={{ fontSize: '13px', color: 'var(--navy-muted)', padding: '4px 8px' }}
              >
                ✕ Đóng
              </button>
            </div>

            <div style={{ fontSize: '13px', lineHeight: '1.7', color: 'var(--navy)', whiteSpace: 'pre-wrap', borderTop: '1px solid var(--line-subtle)', paddingTop: '16px' }}>
              {selectedArticle.content}
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '20px', borderTop: '1px solid var(--line-subtle)', paddingTop: '14px' }}>
              {selectedArticle.tags?.map((t, idx) => (
                <span key={idx} style={{ fontSize: '11px', background: 'var(--surface-subtle)', padding: '3px 8px', borderRadius: '4px', color: 'var(--navy-muted)' }}>
                  #{t}
                </span>
              ))}
            </div>
          </Card>
        )}
      </div>
</div>

</ManagementFrame>
  );
}
