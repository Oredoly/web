export const feedbackTypes = {
  suggestion: '功能建议',
  bug: '程序错误',
  question: '使用咨询',
  content: '内容问题',
  other: '其他',
};

export const feedbackModules = {
  auth: '登录注册',
  dashboard: '工作台',
  courses: '课程管理',
  students: '学生管理',
  works: '作品管理',
  archives: '成长档案',
  assistant: '学习助手',
  other: '其他',
};

export const feedbackStatuses = {
  pending: { label: '待处理', color: 'orange' },
  processing: { label: '处理中', color: 'blue' },
  waiting_user: { label: '待补充', color: 'gold' },
  resolved: { label: '已处理', color: 'green' },
  closed: { label: '已关闭', color: 'default' },
  rejected: { label: '无效或重复', color: 'red' },
};

export const feedbackPriorities = {
  low: { label: '低', color: 'default' },
  normal: { label: '普通', color: 'blue' },
  high: { label: '高', color: 'orange' },
  urgent: { label: '紧急', color: 'red' },
};

export const feedbackTypeOptions = Object.entries(feedbackTypes).map(([value, label]) => ({ value, label }));
export const feedbackModuleOptions = Object.entries(feedbackModules).map(([value, label]) => ({ value, label }));
export const feedbackStatusOptions = Object.entries(feedbackStatuses).map(([value, item]) => ({ value, label: item.label }));
export const feedbackPriorityOptions = Object.entries(feedbackPriorities).map(([value, item]) => ({ value, label: item.label }));
