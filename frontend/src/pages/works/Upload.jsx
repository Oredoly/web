import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Form, Input, Select, Upload, Button, Typography, message, Space } from 'antd';
import { UploadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { workAPI } from '../../api';
import { useAuth } from '../../store/AuthContext';

const { Title } = Typography;

export default function WorkUpload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      workAPI.uploadOptions().then((res) => {
        const opts = res.enrollments || res.courseOptions || [];
        setCourses(opts.map((c) => ({ label: c.course_title, value: c.enrollment_id || c.course_id })));
        if (searchParams.get('enrollment_id')) form.setFieldValue('enrollment_id', Number(searchParams.get('enrollment_id')));
      }).catch(() => {});
    }
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      formData.append('title', values.title);
      formData.append('description', values.description || '');
      formData.append('enrollment_id', values.enrollment_id || '');
      formData.append('task_id', searchParams.get('task_id') || '');
      formData.append('parent_work_id', searchParams.get('parent_work_id') || '');
      await workAPI.upload(formData);
      message.success('作品上传成功');
      navigate('/works');
    } catch { /* handled */ }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/works')}>返回</Button>
        <Title level={4} style={{ margin: 0 }}>📤 上传作品</Title>
      </Space>
      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="title" label="作品名称" rules={[{ required: true, message: '请输入作品名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="成果内容（文字或附件至少填写一种）"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="enrollment_id" label="关联课程">
            <Select placeholder="选择课程" options={courses} />
          </Form.Item>
          <Form.Item label="上传文件（可选）">
            <Upload beforeUpload={(f) => { setFile(f); return false; }} maxCount={1} onRemove={() => setFile(null)}>
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>提交作品</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
