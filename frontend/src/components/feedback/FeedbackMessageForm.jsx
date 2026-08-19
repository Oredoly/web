import { Button, Form, Input } from 'antd';

export default function FeedbackMessageForm({ onSubmit, loading = false, internal = false }) {
  const [form] = Form.useForm();

  const submit = async ({ content }) => {
    await onSubmit(content);
    form.resetFields();
  };

  return (
    <Form form={form} layout="vertical" onFinish={submit}>
      <Form.Item
        name="content"
        label={internal ? '内部备注' : '回复内容'}
        rules={[
          { required: true, message: '请输入内容' },
          { max: 2000, message: '内容不能超过2000字' },
        ]}
      >
        <Input.TextArea rows={4} placeholder={internal ? '仅管理员可见' : '补充说明或回复用户'} />
      </Form.Item>
      <Button type={internal ? 'default' : 'primary'} htmlType="submit" loading={loading}>
        {internal ? '保存内部备注' : '发送回复'}
      </Button>
    </Form>
  );
}
