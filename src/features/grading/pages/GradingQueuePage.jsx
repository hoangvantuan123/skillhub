import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../shared/components/PageHeader';
import SearchFilter from '../../../shared/components/SearchFilter';
import Card from '../../../shared/ui/Card';
import Badge from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import Table from '../../../shared/ui/Table';
import { mockApi } from '../../../mocks/mockService';
import { formatDate, formatScore } from '../../../shared/lib/formatters';
import { ClipboardCheck, ArrowRight, User } from 'lucide-react';

export default function GradingQueuePage() {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    mockApi.getGradingQueue().then((res) => setSubmissions(res.data || []));
  }, []);

  const columns = [
    {
      title: 'Mã bài nộp',
      key: 'id',
      render: (val) => <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>{val}</span>,
    },
    {
      title: 'Thí sinh',
      key: 'candidateName',
      render: (val, row) => (
        <div>
          <strong style={{ color: 'var(--navy)' }}>{val}</strong>
          <small style={{ display: 'block', color: 'var(--navy-muted)' }}>{row.candidateEmail}</small>
        </div>
      ),
    },
    {
      title: 'Kỳ thi',
      key: 'examTitle',
    },
    {
      title: 'Thời gian nộp',
      key: 'submittedAt',
      render: (val) => formatDate(val),
    },
    {
      title: 'Trạng thái chấm',
      key: 'status',
      render: (val) => (
        <Badge variant={val === 'graded' ? 'success' : 'warning'}>
          {val === 'graded' ? 'Đã chốt điểm' : 'Chờ chấm'}
        </Badge>
      ),
    },
    {
      title: 'Điểm',
      key: 'finalScore',
      render: (val, row) => (row.status === 'graded' ? <strong>{formatScore(val, 10)}</strong> : '—'),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <Button size="sm" variant="secondary" icon={ArrowRight} iconPosition="right" onClick={() => navigate(`/manage/grading/${row.id}`)}>
          {row.status === 'graded' ? 'Xem lại điểm' : 'Chấm bài'}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Danh sách bài thi chờ chấm (Grading Queue)"
        subtitle="Chấm các bài thi tự luận và tình huống theo tiêu chí rubric chuẩn hóa."
      />

      <SearchFilter
        searchValue={search}
        onSearchChange={setSearch}
        placeholder="Tìm kiếm theo tên thí sinh, mã bài nộp..."
      />

      <Card style={{ padding: '0', overflow: 'hidden' }}>
        <Table columns={columns} data={submissions} />
      </Card>
    </div>
  );
}
