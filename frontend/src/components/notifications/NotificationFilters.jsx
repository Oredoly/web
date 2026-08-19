import { Select, Space } from 'antd';
import {
  notificationCategoryOptions,
  notificationLevelOptions,
  notificationReadOptions,
} from '../../constants/notification';

export default function NotificationFilters({ value, onChange }) {
  const update = (key, nextValue) => onChange({ ...value, [key]: nextValue, page: 1 });

  return (
    <Space wrap>
      <Select
        allowClear
        placeholder="阅读状态"
        value={value.read}
        options={notificationReadOptions}
        onChange={(read) => update('read', read)}
        style={{ width: 130 }}
      />
      <Select
        allowClear
        placeholder="通知分类"
        value={value.category}
        options={notificationCategoryOptions}
        onChange={(category) => update('category', category)}
        style={{ width: 140 }}
      />
      <Select
        allowClear
        placeholder="通知级别"
        value={value.level}
        options={notificationLevelOptions}
        onChange={(level) => update('level', level)}
        style={{ width: 130 }}
      />
    </Space>
  );
}
