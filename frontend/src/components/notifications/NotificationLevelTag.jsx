import { Tag } from 'antd';
import { notificationLevels } from '../../constants/notification';

export default function NotificationLevelTag({ level }) {
  const item = notificationLevels[level] || { label: level || '未知', color: 'default' };
  return <Tag color={item.color}>{item.label}</Tag>;
}
