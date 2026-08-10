const bcrypt = require('bcryptjs');
const db = require('../config/database');
const fs = require('fs');
const { isStaff, isTeacher } = require('../middleware/auth');
const { buildUserTree } = require('../helpers/userTree');

const USERNAME_RE = /^[a-zA-Z0-9]+$/;
const MANAGED_ROLES = ['student', 'teacher', 'executive_mentor'];

function isValidUsername(username) {
  return username && username.length >= 6 && USERNAME_RE.test(username);
}

function deleteUserWithWorks(userId) {
  const works = db.prepare('SELECT file_path FROM works WHERE student_id = ?').all(userId);
  for (const work of works) {
    if (work.file_path) {
      try { fs.unlinkSync(work.file_path); } catch (e) { /* 文件可能已删除 */ }
    }
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
}

// 学生列表
exports.list = (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const tree = buildUserTree({ search: req.query.search || '', includeExecutive: true });
      const schools = db.prepare('SELECT id, name FROM schools ORDER BY name').all();
      return res.json({ title: '用户管理', tree, schools, filters: req.query });
    }

    let sql = `
      SELECT u.id, u.username, u.real_name, u.email, u.phone, u.is_active,
             s.name as school_name, c.name as class_name, c.grade
      FROM users u
      LEFT JOIN schools s ON u.school_id = s.id
      LEFT JOIN classes c ON u.class_id = c.id
      WHERE u.role = 'student'
    `;
    const params = [];

    if (isTeacher(req.user.role)) {
      sql += ' AND u.school_id = ?';
      params.push(req.user.school_id || 0);
    }

    if (req.query.school_id) { sql += ' AND u.school_id = ?'; params.push(req.query.school_id); }
    if (req.query.class_id) { sql += ' AND u.class_id = ?'; params.push(req.query.class_id); }
    if (req.query.search) {
      sql += ' AND (u.real_name LIKE ? OR u.username LIKE ?)';
      params.push(`%${req.query.search}%`, `%${req.query.search}%`);
    }

    sql += ' ORDER BY u.created_at DESC';

    const students = db.prepare(sql).all(...params);
    const schools = isTeacher(req.user.role)
      ? db.prepare('SELECT id, name FROM schools WHERE id = ? ORDER BY name').all(req.user.school_id || 0)
      : db.prepare('SELECT id, name FROM schools ORDER BY name').all();

    res.json({ title: '学生管理', students, schools, filters: req.query });
  } catch (err) {
    console.error('学生列表错误:', err);
    res.status(500).json({ error:  });
  }
};

// 添加学生页面
exports.showCreate = (req, res) => {
  const schools = isTeacher(req.user.role)
    ? db.prepare('SELECT id, name FROM schools WHERE id = ? ORDER BY name').all(req.user.school_id || 0)
    : db.prepare('SELECT id, name FROM schools ORDER BY name').all();
  res.json({ title: '添加学生', schools, errors: [] });
};

// 添加学生
exports.create = (req, res) => {
  try {
    const { password, real_name, school_id, class_id, email, phone } = req.body;

    if (!real_name) {
      const schools = db.prepare('SELECT id, name FROM schools ORDER BY name').all();
      return res.json({ title: '添加学生', schools, errors: ['姓名为必填项'] });
    }

    if (isTeacher(req.user.role)) {
      const ownSchool = req.user.school_id;
      if (!ownSchool || Number(school_id) !== ownSchool) {
        const schools = db.prepare('SELECT id, name FROM schools ORDER BY name').all();
        return res.json({ title: '添加学生', schools, errors: ['教师只能在本校添加学生'] });
      }
      const cls = db.prepare('SELECT id FROM classes WHERE id = ? AND school_id = ?').get(class_id, ownSchool);
      if (!cls) {
        const schools = db.prepare('SELECT id, name FROM schools ORDER BY name').all();
        return res.json({ title: '添加学生', schools, errors: ['班级必须属于当前学校'] });
      }
    }

    if (!school_id || !class_id) {
      const schools = db.prepare('SELECT id, name FROM schools ORDER BY name').all();
      return res.json({ title: '添加学生', schools, errors: ['学校和班级为必填项'] });
    }

    const nameExists = db.prepare('SELECT id FROM users WHERE real_name = ?').get(real_name);
    if (nameExists) {
      const schools = db.prepare('SELECT id, name FROM schools ORDER BY name').all();
      return res.json({ title: '添加学生', schools, errors: ['该姓名已存在'] });
    }

    const studentUsername = `student${Date.now()}${Math.floor(Math.random() * 100000)}`;
    const studentPassword = password || 'pbl123456';
    const password_hash = bcrypt.hashSync(studentPassword, 10);

    db.prepare(
      `INSERT INTO users (username, password_hash, real_name, email, phone, role, school_id, class_id)
       VALUES (?, ?, ?, ?, ?, 'student', ?, ?)`
    ).run(studentUsername, password_hash, real_name, email || null, phone || null,
          school_id || null, class_id || null);

    res.json({ message: `学生 ${real_name} 添加成功！默认密码: ${studentPassword}` });
  } catch (err) {
    console.error('添加学生错误:', err);
    const schools = db.prepare('SELECT id, name FROM schools ORDER BY name').all();
    res.json({ title: '添加学生', schools, errors: ['添加失败，请稍后重试'] });
  }
};

// 批量导入页面
exports.showImport = (req, res) => {
  res.json({ title: '批量导入用户' });
};

// 批量导入
exports.import = (req, res) => {
  try {
    const { data } = req.body;
    const students = JSON.parse(data);
    let imported = 0;
    const password_hash = bcrypt.hashSync('pbl123456', 10);

    const stmt = db.prepare(
      `INSERT INTO users (username, password_hash, real_name, profile, role, school_id, class_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    for (const s of students) {
      try {
        const role = MANAGED_ROLES.includes(s.role) ? s.role : 'student';
        const prefix = role === 'teacher' ? 'teacher' : role === 'executive_mentor' ? 'mentor' : 'student';
        const username = `${prefix}${Date.now()}${imported}${Math.floor(Math.random() * 1000)}`;
        if (db.prepare('SELECT id FROM users WHERE real_name = ?').get(s.real_name)) continue;
        if (['student', 'teacher'].includes(role) && (!s.school_id || !s.class_id)) continue;
        const finalSchoolId = role === 'executive_mentor' ? null : s.school_id;
        const finalClassId = role === 'executive_mentor' ? null : s.class_id;
        stmt.run(username, password_hash, s.real_name, s.profile || null, role,
                 finalSchoolId || null, finalClassId || null);
        imported++;
      } catch (e) { /* 跳过重复 */ }
    }

    res.json({ message: `成功导入 ${imported} 名用户` });
  } catch (err) {
    console.error('批量导入错误:', err);
    res.status(500).json({ error:  });
  }
};

exports.createSchool = (req, res) => {
  try {
    const { name, description, tags, region, contact_person, contact_phone } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: '学校名称不能为空' });
    }
    db.prepare(
      `INSERT INTO schools (name, description, tags, region, contact_person, contact_phone)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(name.trim(), description || null, tags || null, region || null,
          contact_person || null, contact_phone || null);
    res.json({ message: '学校添加成功' });
  } catch (err) {
    console.error('添加学校错误:', err);
    res.status(500).json({ error:  });
  }
};

exports.deleteSchool = (req, res) => {
  try {
    const school = db.prepare('SELECT id FROM schools WHERE id = ?').get(req.params.id);
    if (!school) {
      return res.status(400).json({ error: '学校不存在' });
    }
    db.prepare('DELETE FROM schools WHERE id = ?').run(req.params.id);
    res.json({ message: '学校已删除，关联班级已删除' });
  } catch (err) {
    console.error('删除学校错误:', err);
    res.status(500).json({ error:  });
  }
};

exports.createClass = (req, res) => {
  try {
    const { name, school_id, grade } = req.body;
    if (!name || !name.trim() || !school_id) {
      return res.status(400).json({ error: '班级名称和所属学校不能为空' });
    }
    const school = db.prepare('SELECT id FROM schools WHERE id = ?').get(school_id);
    if (!school) {
      return res.status(400).json({ error: '所属学校不存在' });
    }
    db.prepare('INSERT INTO classes (name, school_id, grade) VALUES (?, ?, ?)')
      .run(name.trim(), school_id, grade || null);
    res.json({ message: '班级添加成功' });
  } catch (err) {
    console.error('添加班级错误:', err);
    res.status(500).json({ error:  });
  }
};

exports.deleteClass = (req, res) => {
  try {
    const cls = db.prepare('SELECT id FROM classes WHERE id = ?').get(req.params.id);
    if (!cls) {
      return res.status(400).json({ error: '班级不存在' });
    }
    db.prepare('DELETE FROM classes WHERE id = ?').run(req.params.id);
    res.json({ message: '班级已删除' });
  } catch (err) {
    console.error('删除班级错误:', err);
    res.status(500).json({ error:  });
  }
};

exports.createUser = (req, res) => {
  try {
    const { password, real_name, role, school_id, class_id, email, phone, profile } = req.body;

    if (!real_name || !MANAGED_ROLES.includes(role)) {
      return res.status(400).json({ error: '姓名和身份不能为空' });
    }

    if (['student', 'teacher'].includes(role) && (!school_id || !class_id)) {
      return res.status(400).json({ error: '学生和教师必须选择学校和班级' });
    }

    const nameExists = db.prepare('SELECT id FROM users WHERE real_name = ?').get(real_name);
    if (nameExists) {
      return res.status(400).json({ error: '该姓名已存在' });
    }

    if (password && password.length < 6) {
      return res.status(400).json({ error: '密码至少6位' });
    }

    if (class_id) {
      const cls = db.prepare('SELECT id, school_id FROM classes WHERE id = ?').get(class_id);
      if (!cls || (school_id && cls.school_id !== Number(school_id))) {
        return res.status(400).json({ error: '班级不存在或不属于所选学校' });
      }
    }

    const prefix = role === 'teacher' ? 'teacher' : role === 'executive_mentor' ? 'mentor' : 'student';
    const finalUsername = `${prefix}${Date.now()}${Math.floor(Math.random() * 100000)}`;

    const finalPassword = password || 'pbl123456';
    const password_hash = bcrypt.hashSync(finalPassword, 10);
    const finalSchoolId = role === 'executive_mentor' ? null : school_id;
    const finalClassId = role === 'executive_mentor' ? null : class_id;
    db.prepare(
      `INSERT INTO users (username, password_hash, real_name, email, phone, profile, role, school_id, class_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(finalUsername, password_hash, real_name, email || null, phone || null,
          profile || null, role, finalSchoolId || null, finalClassId || null);

    res.json({ message: `用户 ${real_name} 添加成功` });
  } catch (err) {
    console.error('添加用户错误:', err);
    res.status(500).json({ error:  });
  }
};

exports.getUserForEdit = (req, res) => {
  try {
    const user = db.prepare(
      'SELECT id, username, real_name, role, email, phone, profile, school_id, class_id, is_active FROM users WHERE id = ?'
    ).get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json(user);
  } catch (err) {
    console.error('加载编辑用户错误:', err);
    res.status(500).json({ error: '加载失败' });
  }
};

exports.updateUser = (req, res) => {
  try {
    const { real_name, role, school_id, class_id, email, phone, profile, password, is_active } = req.body;
    const userId = req.params.id;

    if (!real_name || !MANAGED_ROLES.includes(role)) {
      return res.status(400).json({ error: '姓名和身份不能为空' });
    }

    if (['student', 'teacher'].includes(role) && (!school_id || !class_id)) {
      return res.status(400).json({ error: '学生和教师必须选择学校和班级' });
    }

    if (class_id) {
      const cls = db.prepare('SELECT id, school_id FROM classes WHERE id = ?').get(class_id);
      if (!cls || (school_id && cls.school_id !== Number(school_id))) {
        return res.status(400).json({ error: '班级不存在或不属于所选学校' });
      }
    }

    const nameExists = db.prepare('SELECT id FROM users WHERE real_name = ? AND id <> ?').get(real_name, userId);
    if (nameExists) {
      return res.status(400).json({ error: '该姓名已存在' });
    }

    if (password && password.length < 6) {
      return res.status(400).json({ error: '密码至少6位' });
    }

    const finalSchoolId = role === 'executive_mentor' ? null : school_id;
    const finalClassId = role === 'executive_mentor' ? null : class_id;
    const active = is_active === 'on' || is_active === '1' ? 1 : 0;

    if (password) {
      const password_hash = bcrypt.hashSync(password, 10);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(password_hash, userId);
    }

    db.prepare(
      `UPDATE users
       SET real_name = ?, role = ?, school_id = ?, class_id = ?, email = ?, phone = ?, profile = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(real_name, role, finalSchoolId || null, finalClassId || null,
          email || null, phone || null, profile || null, active, userId);

    res.json({ message: '用户信息已更新' });
  } catch (err) {
    console.error('更新用户错误:', err);
    res.status(500).json({ error:  });
  }
};

exports.deleteUser = (req, res) => {
  try {
    const user = db.prepare('SELECT id, real_name, role FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(400).json({ error: '用户不存在' });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ error: '不能删除管理员账号' });
    }
    deleteUserWithWorks(req.params.id);
    res.json({ message: `用户 ${user.real_name} 已删除` });
  } catch (err) {
    console.error('删除用户错误:', err);
    res.status(500).json({ error:  });
  }
};

exports.batchDeleteUsers = (req, res) => {
  try {
    const rawIds = req.body.user_ids;
    const rawList = Array.isArray(rawIds) ? rawIds.join(',') : String(rawIds || '');
    const ids = rawList
      .split(',')
      .map((id) => Number(id.trim()))
      .filter((id) => Number.isInteger(id) && id !== req.user.id);

    if (ids.length === 0) {
      return res.status(400).json({ error: '请选择要删除的用户' });
    }

    const placeholders = ids.map(() => '?').join(',');
    const adminRows = db.prepare(
      `SELECT id FROM users WHERE id IN (${placeholders}) AND role = 'admin'`
    ).all(...ids);
    const adminIds = new Set(adminRows.map((row) => row.id));
    const safeIds = ids.filter((id) => !adminIds.has(id));

    for (const id of safeIds) {
      deleteUserWithWorks(id);
    }

    res.json({ message: `已删除 ${safeIds.length} 名用户` });
  } catch (err) {
    console.error('批量删除用户错误:', err);
    res.status(500).json({ error:  });
  }
};

exports.showEditStudent = (req, res) => {
  try {
    const student = db.prepare(
      `SELECT u.*, s.name as school_name, c.name as class_name, c.grade
       FROM users u
       LEFT JOIN schools s ON u.school_id = s.id
       LEFT JOIN classes c ON u.class_id = c.id
       WHERE u.id = ? AND u.role = 'student'`
    ).get(req.params.id);

    if (!student) {
      return res.status(400).json({ error: '学生不存在' });
    }

    if (isTeacher(req.user.role) && student.school_id !== req.user.school_id) {
      return res.status(400).json({ error: '无权编辑其他学校学生' });
    }

    const schools = isTeacher(req.user.role)
      ? db.prepare('SELECT id, name FROM schools WHERE id = ?').all(req.user.school_id || 0)
      : db.prepare('SELECT id, name FROM schools ORDER BY name').all();
    const classes = db.prepare('SELECT id, name, grade FROM classes WHERE school_id = ? ORDER BY grade, name')
      .all(student.school_id);

    res.json({ title: '编辑学生', student, schools, classes, errors: [] });
  } catch (err) {
    console.error('加载编辑学生错误:', err);
    res.status(500).json({ error:  });
  }
};

exports.updateStudent = (req, res) => {
  try {
    const { school_id, class_id } = req.body;
    const student = db.prepare(
      "SELECT id, school_id FROM users WHERE id = ? AND role = 'student'"
    ).get(req.params.id);

    if (!student) {
      return res.status(400).json({ error: '学生不存在' });
    }

    if (isTeacher(req.user.role)) {
      if (Number(school_id) !== req.user.school_id) {
        return res.status(400).json({ error: '教师只能编辑本校学生' });
      }
    }

    const cls = db.prepare('SELECT id FROM classes WHERE id = ? AND school_id = ?')
      .get(class_id, school_id);
    if (!cls) {
      return res.status(400).json({ error: '班级不存在或不属于所选学校' });
    }

    db.prepare('UPDATE users SET school_id = ?, class_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(school_id, class_id, req.params.id);
    res.json({ message: '学生信息已更新' });
  } catch (err) {
    console.error('更新学生错误:', err);
    res.status(500).json({ error:  });
  }
};

exports.deleteStudent = (req, res) => {
  try {
    const student = db.prepare(
      "SELECT id, school_id FROM users WHERE id = ? AND role = 'student'"
    ).get(req.params.id);
    if (!student) {
      return res.status(400).json({ error: '学生不存在' });
    }
    if (isTeacher(req.user.role) && student.school_id !== req.user.school_id) {
      return res.status(400).json({ error: '无权删除其他学校学生' });
    }
    deleteUserWithWorks(req.params.id);
    res.json({ message: '学生已删除' });
  } catch (err) {
    console.error('删除学生错误:', err);
    res.status(500).json({ error:  });
  }
};

// 学生详情
exports.detail = (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (user.role === 'student' && Number(id) !== user.id) {
      return res.status(400).json({ error: '无权查看该学生档案' });
    }

    if (!isStaff(user.role) && user.role !== 'student') {
      return res.status(400).json({ error: '无权查看学生档案' });
    }

    const student = db.prepare(
      `SELECT u.*, s.name as school_name, c.name as class_name, c.grade
       FROM users u
       LEFT JOIN schools s ON u.school_id = s.id
       LEFT JOIN classes c ON u.class_id = c.id
       WHERE u.id = ? AND u.role = 'student'`
    ).get(id);

    if (!student) {
      return res.status(400).json({ error: '学生不存在' });
    }

    if (isTeacher(user.role) && student.school_id !== user.school_id) {
      return res.status(400).json({ error: '无权查看其他学校学生' });
    }

    const courses = db.prepare(
      `SELECT c.title, c.theme, e.enrolled_at, e.completed_at
       FROM enrollments e JOIN courses c ON e.course_id = c.id
       WHERE e.student_id = ? ORDER BY e.enrolled_at DESC`
    ).all(id);

    const works = db.prepare(
      `SELECT w.*, c.title as course_title, t.title as task_title
       FROM works w
       LEFT JOIN enrollments e ON w.enrollment_id = e.id
       LEFT JOIN courses c ON e.course_id = c.id
       LEFT JOIN tasks t ON w.task_id = t.id
       WHERE w.student_id = ? ORDER BY w.created_at DESC`
    ).all(id);

    const reflections = db.prepare(
      `SELECT r.*, l.title as lesson_title, c2.title as course_title
       FROM reflections r
       LEFT JOIN lessons l ON r.lesson_id = l.id
       LEFT JOIN enrollments e ON r.enrollment_id = e.id
       LEFT JOIN courses c2 ON e.course_id = c2.id
       WHERE r.student_id = ? ORDER BY r.created_at DESC`
    ).all(id);

    const evaluations = db.prepare(
      `SELECT ev.*, u2.real_name as evaluator_name
       FROM evaluations ev JOIN users u2 ON ev.evaluator_id = u2.id
       WHERE ev.student_id = ? ORDER BY ev.created_at DESC`
    ).all(id);

    res.json({
      title: `${student.real_name} - 成长档案`,
      student, courses, works, reflections, evaluations
    });
  } catch (err) {
    console.error('学生详情错误:', err);
    res.status(500).json({ error:  });
  }
};

// 获取学校的班级（AJAX）
exports.getClasses = (req, res) => {
  try {
    if (req.user && isTeacher(req.user.role) && Number(req.params.schoolId) !== req.user.school_id) {
      return res.status(403).json({ error: '无权访问该学校班级' });
    }
    const classes = db.prepare(
      'SELECT id, name, grade FROM classes WHERE school_id = ? ORDER BY grade, name'
    ).all(req.params.schoolId);
    res.json(classes);
  } catch (err) {
    console.error('获取班级错误:', err);
    res.status(500).json({ error: '获取失败' });
  }
};
