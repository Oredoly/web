import { Tag } from 'antd';
import { feedbackPriorities } from '../../constants/feedback';

export default function FeedbackPriorityTag({ priority }) {
  const item = feedbackPriorities[priority] || { label: priority || '未知', color: 'default' };
  return <Tag color={item.color}>{item.label}</Tag>;
}
