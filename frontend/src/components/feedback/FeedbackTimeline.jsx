import { Card, Tag, Timeline, Typography } from 'antd';
import dayjs from 'dayjs';

const { Paragraph, Text } = Typography;

export default function FeedbackTimeline({ messages = [] }) {
  if (!messages.length) return <Text type="secondary">暂无沟通记录</Text>;

  return (
    <Timeline
      items={messages.map((message) => {
        const internal = Boolean(message.is_internal);
        const system = message.message_type === 'system';
        return {
          color: internal ? 'gold' : system ? 'gray' : 'blue',
          children: (
            <Card size="small" style={internal ? { background: '#fffbe6' } : undefined}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                <Text strong>{system ? '系统' : message.sender_name || '已注销用户'}</Text>
                <Text type="secondary">{dayjs(message.created_at).format('YYYY-MM-DD HH:mm')}</Text>
              </div>
              <div style={{ marginTop: 6 }}>
                {internal && <Tag color="gold">内部备注</Tag>}
                <Paragraph style={{ whiteSpace: 'pre-wrap', margin: '6px 0 0' }}>{message.content}</Paragraph>
              </div>
            </Card>
          ),
        };
      })}
    />
  );
}
