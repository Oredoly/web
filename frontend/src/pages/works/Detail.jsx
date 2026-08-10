import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Space, Typography, Spin, Input, Popconfirm, message } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons';
import { workAPI } from '../../api';
import { useAuth } from '../../store/AuthContext';

const { Title } = Typography;

export default function WorkDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [work, setWork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    workAPI.detail(id).then((res) => setWork(res.work || res)).catch(() => message.error('加载失败')).finally(() => setLoading(false));
  }, [id]);

  const handleReject = async () => {
    try {
      await workAPI.reject(id, rejectReason);
      message.success('已打回');
      navigate('/works');
    } catch { /* handled */ }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!work) return <p>作品不存在</p>;

  const isOwner = work.student_id === user?.id;

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/works')}>返回</Button>
        <Title level={4} style={{ margin: 0 }}>{work.title}</Title>
      </Space>
      <Card>
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="作者">{work.student_name}</Descriptions.Item>
          <Descriptions.Item label="关联课程">{work.course_title || '—'}</Descriptions.Item>
          <Descriptions.Item label="审核状态">
            <Tag color={work.review_status === 'approved' ? 'green' : work.review_status === 'rejected' ? 'red' : 'orange'}>
              {work.review_status === 'pending' ? '待审核' : work.review_status === 'approved' ? '通过' : '已打回'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="上传时间">{work.created_at}</Descriptions.Item>
        </Descriptions>
        {work.description && <p style={{ marginTop: 12 }}>{work.description}</p>}
        {work.file_path && (
          <div style={{ marginTop: 16 }}>
            <Button type="primary" icon={<DownloadOutlined />} href={`http://localhost:3000/${work.file_path}`} target="_blank">下载文件</Button>
          </div>
        )}

        {user?.role === 'admin' && work.review_status === 'pending' && (
          <Card title="管理员操作" style={{ marginTop: 16 }} size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input.TextArea placeholder="打回原因（可选）" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={2} />
              <Popconfirm title="确定打回该作品？" onConfirm={handleReject}>
                <Button danger>打回作品</Button>
              </Popconfirm>
            </Space>
          </Card>
        )}
      </Card>
    </div>
  );
}
