import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Select, Button, Typography, message, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { archiveAPI } from '../../api';

const { Title, Text } = Typography;

export default function Reflection() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await archiveAPI.submitReflection(values);
      message.success('反思日志提交成功');
      form.resetFields();
      navigate('/dashboard');
    } catch { /* handled */ }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard')}>返回</Button>
        <Title level={4} style={{ margin: 0 }}>✏️ 反思日志</Title>
      </Space>
      <Card>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          记录今天的学习收获、遇到的困难和下一步计划。每天可提交一次。
        </Text>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="content" label="反思内容" rules={[{ required: true, message: '请输入反思内容' }]}>
            <Input.TextArea rows={6} placeholder={`今天学到了什么？\n遇到了什么困难？如何解决的？\n明天计划做什么？`} />
          </Form.Item>
          <Form.Item name="mood" label="今日心情">
            <Select placeholder="选填" options={[
              { label: '😄 很开心', value: 'happy' }, { label: '😊 不错', value: 'good' },
              { label: '😐 一般', value: 'neutral' }, { label: '😞 不太好', value: 'bad' },
            ]} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>提交反思日志</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
