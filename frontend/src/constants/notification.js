export const notificationCategories = {
  feedback: { label: '反馈', color: 'blue' },
  course: { label: '课程', color: 'geekblue' },
  task: { label: '任务', color: 'cyan' },
  work: { label: '作品', color: 'purple' },
  archive: { label: '成长档案', color: 'green' },
  account: { label: '账号', color: 'gold' },
  system: { label: '系统', color: 'default' },
  security: { label: '安全', color: 'red' },
};

export const notificationLevels = {
  normal: { label: '普通', color: 'default' },
  important: { label: '重要', color: 'orange' },
  urgent: { label: '紧急', color: 'red' },
  security: { label: '安全', color: 'magenta' },
};

export const notificationCategoryOptions = Object.entries(notificationCategories)
  .map(([value, item]) => ({ value, label: item.label }));

export const notificationLevelOptions = Object.entries(notificationLevels)
  .map(([value, item]) => ({ value, label: item.label }));

export const notificationReadOptions = [
  { value: 'unread', label: '未读' },
  { value: 'read', label: '已读' },
];
