const db = require('../config/database');

const STAFF_ROLES = ['admin', 'executive_mentor', 'academic_mentor', 'teacher'];
const COURSE_MANAGER_ROLES = ['admin', 'executive_mentor', 'academic_mentor'];

function isStaff(role) {
  return STAFF_ROLES.includes(role);
}

function isTeacher(role) {
  return role === 'teacher';
}

// 认证中间件 - 检查登录状态
function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.flash('error', '请先登录');
    return res.redirect('/auth/login');
  }
  next();
}

// 角色检查中间件
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user) {
      req.flash('error', '请先登录');
      return res.redirect('/auth/login');
    }
    if (!roles.includes(req.session.user.role)) {
      req.flash('error', '您没有权限访问此页面');
      return res.redirect('/dashboard');
    }
    next();
  };
}

function requireNotAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    req.flash('error', '管理员不提交反思日志');
    return res.redirect('/dashboard');
  }
  next();
}

function requireReflectionSubmittable(req, res, next) {
  if (req.session.user && ['admin', 'teacher'].includes(req.session.user.role)) {
    req.flash('error', '教师不提交反思日志');
    return res.redirect('/dashboard');
  }
  next();
}

// 将用户信息和侧边栏数据注入所有视图
function injectUser(req, res, next) {
  res.locals.user = req.session.user || null;
  res.locals.success_msg = req.flash('success');
  res.locals.error_msg = req.flash('error');
  res.locals.currentPath = req.path;

  // 学生侧边栏：注入已选课程和可选课程
  if (req.session.user && req.session.user.role === 'student') {
    try {
      const userId = req.session.user.id;

      // 已选课程
      const myCourses = db.prepare(`
        SELECT c.id, c.title, c.theme, c.grade_level, c.difficulty
        FROM enrollments e JOIN courses c ON e.course_id = c.id
        WHERE e.student_id = ? AND c.status = 'published'
        ORDER BY e.enrolled_at DESC
      `).all(userId);

      res.locals.sidebarMyCourses = myCourses;
      res.locals.sidebarMyCount = myCourses.length;

      // 可选课程（已发布、未选择、限选3门）
      if (myCourses.length < 3) {
        const myIds = myCourses.map(c => c.id);
        if (myIds.length > 0) {
          const placeholders = myIds.map(() => '?').join(',');
          res.locals.sidebarAvailableCourses = db.prepare(`
            SELECT id, title, theme, grade_level, difficulty
            FROM courses WHERE status = 'published' AND id NOT IN (${placeholders})
            ORDER BY updated_at DESC
          `).all(...myIds);
        } else {
          res.locals.sidebarAvailableCourses = db.prepare(`
            SELECT id, title, theme, grade_level, difficulty
            FROM courses WHERE status = 'published'
            ORDER BY updated_at DESC
          `).all();
        }
      } else {
        res.locals.sidebarAvailableCourses = [];
      }
    } catch (err) {
      console.error('侧边栏课程数据错误:', err);
      res.locals.sidebarMyCourses = [];
      res.locals.sidebarMyCount = 0;
      res.locals.sidebarAvailableCourses = [];
    }
  }

  next();
}

module.exports = { requireAuth, requireRole, requireNotAdmin, requireReflectionSubmittable, injectUser, isStaff, isTeacher, STAFF_ROLES, COURSE_MANAGER_ROLES };
