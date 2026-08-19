import { Tag } from 'antd';
import { feedbackStatuses } from '../../constants/feedback';

export default function FeedbackStatusTag({ status }) {
  const item = feedbackStatuses[status] || { label: status || '未知', color: 'default' };
  return <Tag color={item.color}>{item.label}</Tag>;
}
