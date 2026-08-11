const jwt = require('jsonwebtoken');

const STAFF_ROLES = ['admin', 'executive_mentor', 'academic_mentor', 'teacher'];
const COURSE_MANAGER_ROLES = ['admin', 'executive_mentor', 'academic_mentor'];

function isStaff(role) {
  return STAFF_ROLES.includes(role);
}

function isTeacher(role) {
  return role === 'teacher';
}

// JWT 认证中间件 - 验证 token 并将用户信息挂到 req.user
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录', message: '请先登录' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, req.app.get('jwt_secret'));
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '登录已过期', message: '请重新登录' });
    }
    return res.status(401).json({ error: '无效的认证信息', message: '请重新登录' });
  }
}

// 角色检查中间件
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: '未登录', message: '请先登录' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '无权限', message: '您没有权限执行此操作' });
    }
    next();
  };
}

// 禁止管理员提交反思日志
function requireNotAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return res.status(403).json({ error: '无权限', message: '管理员不提交反思日志' });
  }
  next();
}

// 只允许学生和导师提交反思日志（排除管理员和教师）
function requireReflectionSubmittable(req, res, next) {
  if (req.user && ['admin', 'teacher'].includes(req.user.role)) {
    return res.status(403).json({ error: '无权限', message: '教师和管理员不提交反思日志' });
  }
  next();
}

module.exports = {
  requireAuth,
  requireRole,
  requireNotAdmin,
  requireReflectionSubmittable,
  isStaff,
  isTeacher,
  STAFF_ROLES,
  COURSE_MANAGER_ROLES
};
