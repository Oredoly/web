const jwt = require('jsonwebtoken');
const db = require('../config/database');

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

// 强制修改密码守卫：管理员重置密码后、用户改密成功前，阻止访问业务接口
function requirePasswordChanged(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: '未登录', message: '请先登录' });
  }
  try {
    const row = db.prepare('SELECT force_reset_password FROM users WHERE id = ?').get(req.user.id);
    if (row && row.force_reset_password === 1) {
      return res.status(403).json({ error: '请先修改初始密码', code: 'FORCE_RESET' });
    }
  } catch (err) {
    console.error('检查强制改密状态错误:', err);
  }
  next();
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
  requirePasswordChanged,
  requireNotAdmin,
  requireReflectionSubmittable,
  isStaff,
  isTeacher,
  STAFF_ROLES,
  COURSE_MANAGER_ROLES
};
