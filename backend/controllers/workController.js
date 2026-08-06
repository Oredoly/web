const db = require('../config/database');
const fs = require('fs');
const path = require('path');
const { isStaff, isTeacher } = require('../middleware/auth');

function removeUploadedFile(file) {
  if (file && file.path) {
    try { fs.unlinkSync(file.path); } catch (e) { /* 文件可能已删除 */ }
  }
}

// 作品列表
exports.list = (req, res) => {
  try {
    let sql = `
      SELECT w.*, u.real_name as student_name, c.title as course_title,
             t.title as task_title, s.name as school_name
      FROM works w
      JOIN users u ON w.student_id = u.id
      LEFT JOIN enrollments e ON w.enrollment_id = e.id
      LEFT JOIN courses c ON e.course_id = c.id
      LEFT JOIN tasks t ON w.task_id = t.id
      LEFT JOIN schools s ON u.school_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (req.query.student_id) { sql += ' AND w.student_id = ?'; params.push(req.query.student_id); }
    if (req.query.course_id) { sql += ' AND c.id = ?'; params.push(req.query.course_id); }
    if (req.query.search) {
      sql += ' AND (w.title LIKE ? OR w.description LIKE ?)';
      params.push(`%${req.query.search}%`, `%${req.query.search}%`);
    }
    if (req.session.user.role === 'student') {
      sql += ' AND w.student_id = ?';
      params.push(req.session.user.id);
    } else if (!isStaff(req.session.user.role)) {
      sql += ' AND w.student_id = ?';
      params.push(req.session.user.id);
    }

    if (isTeacher(req.session.user.role)) {
      sql += ` AND (u.school_id = ? OR (c.id IS NOT NULL AND c.status = 'published'))`;
      params.push(req.session.user.school_id || 0);
    }

    sql += ' ORDER BY w.created_at DESC';

    const works = db.prepare(sql).all(...params);
    const courses = db.prepare('SELECT id, title FROM courses ORDER BY title').all();

    res.render('works/list', { title: '作品管理', works, courses, filters: req.query });
  } catch (err) {
    console.error('作品列表错误:', err);
    req.flash('error', '加载作品列表失败');
    res.redirect('/dashboard');
  }
};

// 上传作品页面
exports.showUpload = (req, res) => {
  try {
    if (req.session.user.role === 'admin') {
      req.flash('error', '管理员不可上传作品');
      return res.redirect('/works');
    }

    const userId = req.session.user.id;
    let enrollments = [];

    if (isStaff(req.session.user.role)) {
      let students;
      if (isTeacher(req.session.user.role)) {
        const schoolId = req.session.user.school_id || 0;
        enrollments = db.prepare(
          `SELECT e.id as enrollment_id, c.id as course_id, c.title as course_title,
                  u.real_name as student_name, u.id as student_id
           FROM enrollments e
           JOIN courses c ON e.course_id = c.id
           JOIN users u ON e.student_id = u.id
           WHERE u.school_id = ?
           ORDER BY u.real_name`
        ).all(schoolId);
        students = db.prepare(
          "SELECT id, real_name FROM users WHERE role = 'student' AND school_id = ? ORDER BY real_name"
        ).all(schoolId);
      } else {
        enrollments = db.prepare(
          `SELECT e.id as enrollment_id, c.id as course_id, c.title as course_title,
                  u.real_name as student_name, u.id as student_id
           FROM enrollments e
           JOIN courses c ON e.course_id = c.id
           JOIN users u ON e.student_id = u.id
           ORDER BY u.real_name`
        ).all();
        students = db.prepare("SELECT id, real_name FROM users WHERE role = 'student' ORDER BY real_name").all();
      }
      const courseOptions = Array.from(new Map(enrollments.map((e) => [e.course_id, e])).values());
      return res.render('works/upload', { title: '上传作品', enrollments, courseOptions, students });
    }

    enrollments = db.prepare(
      `SELECT e.id as enrollment_id, c.id as course_id, c.title as course_title
       FROM enrollments e JOIN courses c ON e.course_id = c.id
       WHERE e.student_id = ?`
    ).all(userId);

    const courseOptions = Array.from(new Map(enrollments.map((e) => [e.course_id, e])).values());
    res.render('works/upload', { title: '上传作品', enrollments, courseOptions, students: [] });
  } catch (err) {
    console.error('加载上传页错误:', err);
    req.flash('error', '加载失败');
    res.redirect('/works');
  }
};

// 处理作品上传
exports.upload = (req, res) => {
  try {
    if (req.session.user.role === 'admin') {
      removeUploadedFile(req.file);
      req.flash('error', '管理员不可上传作品');
      return res.redirect('/works');
    }

    if (!req.file) {
      req.flash('error', '请选择要上传的文件');
      return res.redirect('/works/upload');
    }

    const { title, description, enrollment_id, task_id, student_id } = req.body;
    const user = req.session.user;
    const staff = isStaff(user.role);

    if (!title) {
      removeUploadedFile(req.file);
      req.flash('error', '请填写作品名称');
      return res.redirect('/works/upload');
    }

    if (!staff && student_id && Number(student_id) !== user.id) {
      removeUploadedFile(req.file);
      req.flash('error', '无权替其他学生上传作品');
      return res.redirect('/works/upload');
    }

    const actualStudentId = staff ? (student_id || user.id) : user.id;
    const student = db.prepare(
      "SELECT id, school_id FROM users WHERE id = ? AND role = 'student'"
    ).get(actualStudentId);

    if (!student) {
      removeUploadedFile(req.file);
      req.flash('error', '所选学生不存在');
      return res.redirect('/works/upload');
    }

    if (isTeacher(user.role) && student.school_id !== user.school_id) {
      removeUploadedFile(req.file);
      req.flash('error', '教师只能为本校学生上传作品');
      return res.redirect('/works/upload');
    }

    let enrollmentCourseId = null;
    if (enrollment_id) {
      const enrollment = db.prepare(
        'SELECT id, course_id FROM enrollments WHERE id = ? AND student_id = ?'
      ).get(enrollment_id, actualStudentId);
      if (!enrollment) {
        removeUploadedFile(req.file);
        req.flash('error', '所选课程报名记录不属于该学生');
        return res.redirect('/works/upload');
      }
      enrollmentCourseId = enrollment.course_id;
    }

    if (task_id) {
      const task = db.prepare(`
        SELECT t.id, l.course_id
        FROM tasks t
        JOIN lessons l ON l.id = t.lesson_id
        WHERE t.id = ?
      `).get(task_id);
      if (!task || (enrollmentCourseId && task.course_id !== enrollmentCourseId)) {
        removeUploadedFile(req.file);
        req.flash('error', '所选任务不属于当前课程');
        return res.redirect('/works/upload');
      }
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const displayType = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext) ? 'image' :
                        ['.mp4', '.webm'].includes(ext) ? 'video' :
                        ext === '.pdf' ? 'pdf' : 'file';

    db.prepare(
      `INSERT INTO works (student_id, enrollment_id, task_id, title, description,
        file_path, file_type, file_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(actualStudentId, enrollment_id || null, task_id || null, title,
          description || null, req.file.path, displayType, req.file.size);

    req.flash('success', '作品上传成功！');
    res.redirect('/works');
  } catch (err) {
    console.error('上传作品错误:', err);
    removeUploadedFile(req.file);
    req.flash('error', '上传失败');
    res.redirect('/works/upload');
  }
};

// 作品详情
exports.detail = (req, res) => {
  try {
    const work = db.prepare(
      `SELECT w.*, u.real_name as student_name, c.title as course_title,
              t.title as task_title, u.school_id as student_school_id, c.status as course_status
       FROM works w
       JOIN users u ON w.student_id = u.id
       LEFT JOIN enrollments e ON w.enrollment_id = e.id
       LEFT JOIN courses c ON e.course_id = c.id
       LEFT JOIN tasks t ON w.task_id = t.id
       WHERE w.id = ?`
    ).get(req.params.id);

    if (!work) {
      req.flash('error', '作品不存在');
      return res.redirect('/works');
    }

    if (!isStaff(req.session.user.role) && work.student_id !== req.session.user.id) {
      req.flash('error', '无权查看该作品');
      return res.redirect('/works');
    }

    if (isTeacher(req.session.user.role) && work.student_school_id !== req.session.user.school_id
        && work.course_status !== 'published') {
      req.flash('error', '无权查看其他学校作品');
      return res.redirect('/works');
    }

    res.render('works/detail', { title: work.title, work });
  } catch (err) {
    console.error('作品详情错误:', err);
    req.flash('error', '加载失败');
    res.redirect('/works');
  }
};

// 删除作品
exports.delete = (req, res) => {
  try {
    const work = db.prepare(`
      SELECT w.id, w.student_id, w.file_path, u.school_id as student_school_id
      FROM works w
      JOIN users u ON u.id = w.student_id
      WHERE w.id = ?
    `).get(req.params.id);

    if (!work) {
      req.flash('error', '作品不存在');
      return res.redirect('/works');
    }

    if (!isStaff(req.session.user.role) && work.student_id !== req.session.user.id) {
      req.flash('error', '无权删除该作品');
      return res.redirect('/works');
    }

    if (isTeacher(req.session.user.role) && work.student_school_id !== req.session.user.school_id) {
      req.flash('error', '无权删除其他学校作品');
      return res.redirect('/works');
    }

    if (work.file_path) {
      try { fs.unlinkSync(work.file_path); } catch (e) { /* 文件可能已删除 */ }
    }
    db.prepare('DELETE FROM works WHERE id = ?').run(req.params.id);
    req.flash('success', '作品已删除');
    res.redirect('/works');
  } catch (err) {
    console.error('删除作品错误:', err);
    req.flash('error', '删除失败');
    res.redirect('/works');
  }
};

exports.reject = (req, res) => {
  try {
    const work = db.prepare('SELECT id FROM works WHERE id = ?').get(req.params.id);
    if (!work) {
      req.flash('error', '作品不存在');
      return res.redirect('/works');
    }

    const reason = (req.body.reason || '').trim() || '作品不符合要求，请修改后重新提交';
    db.prepare(
      "UPDATE works SET review_status = 'rejected', reject_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(reason, req.params.id);

    req.flash('success', '作品已打回');
    res.redirect('/works');
  } catch (err) {
    console.error('打回作品错误:', err);
    req.flash('error', '打回失败');
    res.redirect('/works');
  }
};
