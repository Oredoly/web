import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Card, Button, Tag, Space, Input, Typography, Popconfirm, message } from 'antd';
import { PlusOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { workAPI } from '../../api';
import { useAuth } from '../../store/AuthContext';

const { Title } = Typography;

export default function WorkList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const loadWorks = async () => {
    setLoading(true);
    try {
      const res = await workAPI.list({ search });
      setWorks(res.works || []);
    } catch { /* handled */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadWorks(); }, [search]);

  const handleDelete = async (id) => {
    try { await workAPI.delete(id); message.success('已删除'); loadWorks(); } catch { /* handled */ }
  };

  const columns = [
    { title: '作品名称', dataIndex: 'title', key: 'title', render: (text, r) => <a onClick={() => navigate(`/works/${r.id}`)}>{text}</a> },
    { title: '作者', dataIndex: 'student_name', key: 'student_name' },
    { title: '关联课程', dataIndex: 'course_title', key: 'course_title' },
    { title: '审核状态', dataIndex: 'review_status', key: 'review_status',
      render: (v) => {
        const map = { pending: { color: 'orange', label: '待审核' }, approved: { color: 'green', label: '通过' }, rejected: { color: 'red', label: '已打回' } };
        const info = map[v] || { color: 'default', label: v };
        return <Tag color={info.color}>{info.label}</Tag>;
      }
    },
    { title: '上传时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作', key: 'actions', render: (_, r) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/works/${r.id}`)}>查看</Button>
          {['admin', 'executive_mentor', 'academic_mentor'].includes(user?.role) && r.student_id === user?.id === false && (
            <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
              <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
          {r.student_id === user?.id && (
            <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
              <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      )
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>📄 作品管理</Title>
        {user?.role !== 'admin' && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/works/upload')}>上传作品</Button>
        )}
      </div>
      <Card>
        <Input.Search placeholder="搜索作品" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 300, marginBottom: 16 }} />
        <Table dataSource={works} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>
    </div>
  );
}
