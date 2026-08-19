import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Space, Table, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { feedbackAPI } from '../../api';
import FeedbackFilters from '../../components/feedback/FeedbackFilters';
import FeedbackStatusTag from '../../components/feedback/FeedbackStatusTag';
import { feedbackTypes } from '../../constants/feedback';

const { Title } = Typography;

export default function FeedbackList() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ page: 1, pageSize: 20 });
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    feedbackAPI.mine(filters).then((response) => {
      if (!active) return;
      setItems(response.data.items);
      setPagination(response.data.pagination);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [filters]);

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
    { title: '类型', dataIndex: 'type', width: 110, render: (value) => feedbackTypes[value] || value },
    { title: '状态', dataIndex: 'status', width: 110, render: (status) => <FeedbackStatusTag status={status} /> },
    { title: '更新时间', dataIndex: 'updated_at', width: 170, render: (value) => dayjs(value).format('YYYY-MM-DD HH:mm') },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>我的反馈</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/feedback/new')}>提交反馈</Button>
      </div>
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <FeedbackFilters value={filters} onChange={changeFilters} />
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
