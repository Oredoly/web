import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Typography, Space, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { studentAPI } from '../../api';

const { Title } = Typography;

const roleMap = {
  admin: { label: '管理员', color: 'red' },
  executive_mentor: { label: '执行导师', color: 'purple' },
  academic_mentor: { label: '学术导师', color: 'blue' },
  teacher: { label: '教师', color: 'green' },
  student: { label: '学生', color: 'cyan' },
};

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentAPI.detail(id).then((res) => {
      if (res.user) setStudent(res.user);
      else if (res.student) setStudent(res.student);
      else setStudent(res);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!student) return <p>用户不存在</p>;

  const roleInfo = roleMap[student.role] || { label: student.role, color: 'default' };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/students')}>返回</Button>
        <Title level={4} style={{ margin: 0 }}>{student.real_name} 的详细信息</Title>
        <Tag color={roleInfo.color}>{roleInfo.label}</Tag>
      </Space>
      <Card>
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="用户名">{student.username}</Descriptions.Item>
          <Descriptions.Item label="真实姓名">{student.real_name}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{student.email || '—'}</Descriptions.Item>
          <Descriptions.Item label="手机号">{student.phone || '—'}</Descriptions.Item>
          <Descriptions.Item label="学校">{student.school_name || '—'}</Descriptions.Item>
          <Descriptions.Item label="班级">{student.class_name || '—'}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={student.is_active ? 'green' : 'red'}>{student.is_active ? '正常' : '禁用'}</Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}
