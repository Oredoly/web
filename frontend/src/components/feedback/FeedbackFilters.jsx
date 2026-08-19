import { Input, Select, Space } from 'antd';
import {
  feedbackModuleOptions,
  feedbackPriorityOptions,
  feedbackStatusOptions,
  feedbackTypeOptions,
} from '../../constants/feedback';

export default function FeedbackFilters({ value, onChange, admin = false }) {
  const update = (key, nextValue) => onChange({ ...value, [key]: nextValue, page: 1 });

  return (
    <Space wrap>
      {admin && (
        <Input.Search
          allowClear
          placeholder="编号、标题或提交人"
          defaultValue={value.search}
          onSearch={(search) => update('search', search)}
          style={{ width: 240 }}
        />
      )}
      <Select
        allowClear
        placeholder="状态"
        value={value.status}
        options={feedbackStatusOptions}
        onChange={(status) => update('status', status)}
        style={{ width: 140 }}
      />
      <Select
        allowClear
        placeholder="反馈类型"
        value={value.type}
        options={feedbackTypeOptions}
        onChange={(type) => update('type', type)}
        style={{ width: 140 }}
      />
      {admin && (
        <>
          <Select
            allowClear
            placeholder="关联模块"
            value={value.module}
            options={feedbackModuleOptions}
            onChange={(module) => update('module', module)}
            style={{ width: 140 }}
          />
          <Select
            allowClear
            placeholder="优先级"
            value={value.priority}
            options={feedbackPriorityOptions}
            onChange={(priority) => update('priority', priority)}
            style={{ width: 120 }}
          />
        </>
      )}
    </Space>
  );
}
