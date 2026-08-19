import { Badge, Flex, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { notificationCategories } from '../../constants/notification';
import NotificationLevelTag from './NotificationLevelTag';

const { Text, Paragraph } = Typography;

export default function NotificationItem({ notification, compact = false, onClick }) {
  const category = notificationCategories[notification.category]
    || { label: notification.category || '其他', color: 'default' };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(notification)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') onClick?.(notification);
      }}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        padding: compact ? '10px 12px' : '14px 16px',
        background: notification.is_read ? '#fff' : '#f6faff',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <Flex justify="space-between" align="flex-start" gap={12}>
        <Flex vertical gap={4} style={{ minWidth: 0 }}>
          <Flex align="center" gap={6} wrap>
            {!notification.is_read && <Badge status="processing" />}
            <Text strong={!notification.is_read} ellipsis>{notification.title}</Text>
          </Flex>
          <Paragraph
            type="secondary"
            ellipsis={{ rows: compact ? 1 : 2 }}
            style={{ margin: 0 }}
          >
            {notification.summary || notification.content}
          </Paragraph>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayjs(notification.received_at || notification.published_at).format('YYYY-MM-DD HH:mm')}
          </Text>
        </Flex>
        <Flex vertical align="flex-end" gap={4}>
          <Tag color={category.color} style={{ marginInlineEnd: 0 }}>{category.label}</Tag>
          {!compact && <NotificationLevelTag level={notification.level} />}
        </Flex>
      </Flex>
    </div>
  );
}
