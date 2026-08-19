import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button, Card, Col, Row, Space, Statistic, Table, Typography } from 'antd';
import { ExclamationCircleOutlined, FileTextOutlined, SyncOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { feedbackAPI } from '../../api';
import FeedbackFilters from '../../components/feedback/FeedbackFilters';
import FeedbackPriorityTag from '../../components/feedback/FeedbackPriorityTag';
import FeedbackStatusTag from '../../components/feedback/FeedbackStatusTag';
import { feedbackTypes } from '../../constants/feedback';
import { useAuth } from '../../store/AuthContext';

const { Title } = Typography;

export default function FeedbackManage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filters, setFilters] = useState({ page: 1, pageSize: 20 });
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [stats, setStats] = useState({ pending: 0, processing: 0, urgent: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') return undefined;
    let active = true;
    Promise.all([feedbackAPI.manageList(filters), feedbackAPI.stats()]).then(([listResponse, statsResponse]) => {
      if (!active) return;
      setItems(listResponse.data.items);
      setPagination(listResponse.data.pagination);
      setStats(statsResponse.data.stats);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [filters, user?.role]);

  if (user?.role !== 'admin') return <Navigate to="/feedback" replace />;

  const changeFilters = (next) => {
    setLoading(true);
    setFilters(next);
  };

  const columns = [
    {
      title: '反馈编号', dataIndex: 'feedback_no', width: 180,
      render: (value, row) => <Button type="link" onClick={() => navigate(`/feedback/${row.id}`)}>{value}</Button>,
    },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    { title: '提交人', dataIndex: 'user_name', width: 120, render: (value) => value || '已注销用户' },
    { title: '类型', dataIndex: 'type', width: 110, render: (value) => feedbackTypes[value] || value },
    { title: '优先级', dataIndex: 'priority', width: 90, render: (priority) => <FeedbackPriorityTag priority={priority} /> },
    { title: '状态', dataIndex: 'status', width: 110, render: (status) => <FeedbackStatusTag status={status} /> },
    { title: '更新时间', dataIndex: 'updated_at', width: 170, render: (value) => dayjs(value).format('YYYY-MM-DD HH:mm') },
  ];

  return (
    <div>
      <Title level={4}>反馈管理</Title>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}><Card><Statistic title="待处理" value={stats.pending} prefix={<FileTextOutlined />} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="处理中" value={stats.processing} prefix={<SyncOutlined spin={stats.processing > 0} />} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="紧急未结" value={stats.urgent} valueStyle={{ color: stats.urgent ? '#cf1322' : undefined }} prefix={<ExclamationCircleOutlined />} /></Card></Col>
        <Col xs={12} md={6}><Card><Statistic title="累计反馈" value={stats.total} /></Card></Col>
      </Row>

      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <FeedbackFilters admin value={filters} onChange={changeFilters} />
          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={items}
            pagination={{
              current: pagination.page,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showTotal: (total) => `共 ${total} 条`,
              onChange: (page, pageSize) => {
                setLoading(true);
                setFilters((current) => ({ ...current, page, pageSize }));
              },
            }}
          />
        </Space>
      </Card>
    </div>
  );
}
