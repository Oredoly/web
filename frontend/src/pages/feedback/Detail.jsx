import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Descriptions, Input, List, Modal, Select, Space, Spin, Typography, message } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { feedbackAPI } from '../../api';
import FeedbackMessageForm from '../../components/feedback/FeedbackMessageForm';
import FeedbackPriorityTag from '../../components/feedback/FeedbackPriorityTag';
import FeedbackStatusTag from '../../components/feedback/FeedbackStatusTag';
import FeedbackTimeline from '../../components/feedback/FeedbackTimeline';
import {
  feedbackModules,
  feedbackPriorities,
  feedbackPriorityOptions,
  feedbackStatuses,
  feedbackStatusTransitions,
  feedbackTypes,
} from '../../constants/feedback';
import { useAuth } from '../../store/AuthContext';

const { Title, Paragraph, Text } = Typography;

export default function FeedbackDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolution, setResolution] = useState('');

  const load = () => feedbackAPI.detail(id).then((response) => setData(response.data));

  useEffect(() => {
    let active = true;
    feedbackAPI.detail(id).then((response) => {
      if (active) setData(response.data);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [id]);

  const runAction = async (action, successText) => {
    setActionLoading(true);
    try {
      await action();
      message.success(successText);
      await load();
    } finally {
      setActionLoading(false);
    }
  };

  const download = async (attachment) => {
    const blob = await feedbackAPI.downloadAttachment(attachment.id);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = attachment.original_name;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!data?.feedback) return <Card>反馈不存在或无权访问。</Card>;

  const { feedback, messages, attachments } = data;
  const isOwner = feedback.user_id === user?.id;
  const canReply = user?.role === 'admin' || !['closed', 'rejected'].includes(feedback.status);
  const canReopen = isOwner && ['resolved', 'closed', 'rejected'].includes(feedback.status);
  const nextStatusOptions = (feedbackStatusTransitions[feedback.status] || []).map((value) => ({
    value,
    label: feedbackStatuses[value]?.label || value,
  }));

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(user?.role === 'admin' ? '/feedback/manage' : '/feedback')}>返回</Button>
        <Title level={4} style={{ margin: 0 }}>{feedback.title}</Title>
      </Space>

      <Card style={{ marginBottom: 16 }}>
        <Descriptions bordered size="small" column={{ xs: 1, md: 2 }}>
          <Descriptions.Item label="反馈编号">{feedback.feedback_no}</Descriptions.Item>
          <Descriptions.Item label="状态"><FeedbackStatusTag status={feedback.status} /></Descriptions.Item>
          <Descriptions.Item label="类型">{feedbackTypes[feedback.type] || feedback.type}</Descriptions.Item>
          <Descriptions.Item label="关联模块">{feedbackModules[feedback.module] || '未指定'}</Descriptions.Item>
          {user?.role === 'admin' && (
            <Descriptions.Item label="优先级"><FeedbackPriorityTag priority={feedback.priority} /></Descriptions.Item>
          )}
          <Descriptions.Item label="提交时间">{dayjs(feedback.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
        </Descriptions>
        <Title level={5} style={{ marginTop: 20 }}>详细描述</Title>
        <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{feedback.description}</Paragraph>
        {feedback.resolution && (
          <Card type="inner" title="处理结果" style={{ marginTop: 16 }}>
            <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{feedback.resolution}</Paragraph>
          </Card>
        )}
      </Card>

      {attachments.length > 0 && (
        <Card title="附件" style={{ marginBottom: 16 }}>
          <List
            dataSource={attachments}
            renderItem={(attachment) => (
              <List.Item actions={[<Button key="download" type="link" icon={<DownloadOutlined />} onClick={() => download(attachment)}>下载</Button>]}>
                <List.Item.Meta
                  title={attachment.original_name}
                  description={`${Math.ceil(attachment.file_size / 1024)} KB`}
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      <Card title="处理记录" style={{ marginBottom: 16 }}>
        <FeedbackTimeline messages={messages} />
      </Card>

      <Card title="继续沟通">
        {canReply ? (
          <FeedbackMessageForm
            loading={actionLoading}
            onSubmit={(content) => runAction(() => feedbackAPI.reply(id, content), '回复已发送')}
          />
        ) : (
          <Text type="secondary">该反馈已结束。如仍有问题，可以申请重新处理。</Text>
        )}
        <Space style={{ marginTop: 16 }}>
          {isOwner && feedback.status === 'resolved' && (
            <Button type="primary" loading={actionLoading} onClick={() => runAction(() => feedbackAPI.confirm(id), '已确认解决')}>
              确认已解决
            </Button>
          )}
          {canReopen && <Button onClick={() => setReopenOpen(true)}>申请重新处理</Button>}
        </Space>
      </Card>

      {user?.role === 'admin' && (
        <Card title="管理员处理" style={{ marginTop: 16 }}>
          <Space wrap style={{ marginBottom: 20 }}>
            <span>优先级：</span>
            <Select
              value={feedback.priority}
              options={feedbackPriorityOptions}
              style={{ width: 120 }}
              onChange={async (priority) => {
                try {
                  await runAction(
                    () => feedbackAPI.updatePriority(id, priority),
                    `优先级已设为${feedbackPriorities[priority]?.label || priority}`,
                  );
                } catch { /* API 拦截器统一提示 */ }
              }}
            />
            <span>变更状态：</span>
            <Select
              placeholder="选择下一状态"
              options={nextStatusOptions}
              style={{ width: 160 }}
              onChange={async (status) => {
                try {
                  await runAction(
                    () => feedbackAPI.updateStatus(id, status),
                    `状态已更新为${feedbackStatuses[status]?.label || status}`,
                  );
                } catch { /* API 拦截器统一提示 */ }
              }}
            />
            {!['closed', 'rejected'].includes(feedback.status) && (
              <Button type="primary" onClick={() => setResolveOpen(true)}>填写处理结果</Button>
            )}
          </Space>
          <FeedbackMessageForm
            internal
            loading={actionLoading}
            onSubmit={(content) => runAction(() => feedbackAPI.addInternalNote(id, content), '内部备注已保存')}
          />
        </Card>
      )}

      <Modal
        title="申请重新处理"
        open={reopenOpen}
        confirmLoading={actionLoading}
        onCancel={() => setReopenOpen(false)}
        onOk={async () => {
          if (!reopenReason.trim()) return message.warning('请说明原因');
          await runAction(() => feedbackAPI.reopen(id, reopenReason), '反馈已重新打开');
          setReopenOpen(false);
          setReopenReason('');
        }}
      >
        <Input.TextArea rows={4} maxLength={2000} value={reopenReason} onChange={(event) => setReopenReason(event.target.value)} />
      </Modal>

      <Modal
        title="填写处理结果"
        open={resolveOpen}
        confirmLoading={actionLoading}
        onCancel={() => setResolveOpen(false)}
        onOk={async () => {
          if (!resolution.trim()) return message.warning('请填写处理结果');
          try {
            await runAction(() => feedbackAPI.resolve(id, resolution), '反馈已标记为已处理');
            setResolveOpen(false);
            setResolution('');
          } catch { /* API 拦截器统一提示 */ }
        }}
      >
        <Input.TextArea
          rows={5}
          maxLength={5000}
          showCount
          value={resolution}
          onChange={(event) => setResolution(event.target.value)}
          placeholder="说明处理方式、结果或建议"
        />
      </Modal>
    </div>
  );
}
