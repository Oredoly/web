const FEEDBACK_TYPES = ['suggestion', 'bug', 'question', 'content', 'other'];
const FEEDBACK_MODULES = ['auth', 'dashboard', 'courses', 'students', 'works', 'archives', 'assistant', 'other'];
const FEEDBACK_PRIORITIES = ['low', 'normal', 'high', 'urgent'];
const FEEDBACK_STATUSES = ['pending', 'processing', 'waiting_user', 'resolved', 'closed', 'rejected'];

const STATUS_TRANSITIONS = {
  pending: ['processing', 'waiting_user', 'resolved', 'rejected'],
  processing: ['waiting_user', 'resolved', 'rejected'],
  waiting_user: ['processing', 'resolved', 'rejected'],
  resolved: ['closed', 'processing'],
  closed: ['processing'],
  rejected: ['processing'],
};

const FEEDBACK_LABELS = {
  types: {
    suggestion: '功能建议',
    bug: '程序错误',
    question: '使用咨询',
    content: '内容问题',
    other: '其他',
  },
  modules: {
    auth: '登录注册',
    dashboard: '工作台',
    courses: '课程管理',
    students: '学生管理',
    works: '作品管理',
    archives: '成长档案',
    assistant: '学习助手',
    other: '其他',
  },
  priorities: {
    low: '低',
    normal: '普通',
    high: '高',
    urgent: '紧急',
  },
  statuses: {
    pending: '待处理',
    processing: '处理中',
    waiting_user: '待用户补充',
    resolved: '已处理',
    closed: '已关闭',
    rejected: '无效或重复',
  },
};

module.exports = {
  FEEDBACK_TYPES,
  FEEDBACK_MODULES,
  FEEDBACK_PRIORITIES,
  FEEDBACK_STATUSES,
  STATUS_TRANSITIONS,
  FEEDBACK_LABELS,
};
