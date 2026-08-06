const db = require('../config/database');
const { isStaff, isTeacher } = require('../middleware/auth');
const { buildUserTree } = require('../helpers/userTree');

function loadStudentArchive(studentId) {
  const student = db.prepare(
    `SELECT u.*, s.name as school_name, c2.name as class_name, c2.grade
     FROM users u
     LEFT JOIN schools s ON u.school_id = s.id
     LEFT JOIN classes c2 ON u.class_id = c2.id
     WHERE u.id = ? AND u.role = 'student'`
  ).get(studentId);

  if (!student) return null;

  const courses = db.prepare(
    `SELECT c.title, c.theme, c.grade_level, c.difficulty,
            e.enrolled_at, e.completed_at
     FROM enrollments e JOIN courses c ON e.course_id = c.id
     WHERE e.student_id = ? ORDER BY e.enrolled_at DESC`
  ).all(studentId);

  const works = db.prepare('SELECT * FROM works WHERE student_id = ? ORDER BY created_at DESC').all(studentId);

  const reflections = db.prepare(
    `SELECT r.*, l.title as lesson_title
     FROM reflections r
     LEFT JOIN lessons l ON r.lesson_id = l.id
     WHERE r.student_id = ? ORDER BY r.created_at DESC`
  ).all(studentId);

  const evaluations = db.prepare(
    `SELECT ev.*, u2.real_name as evaluator_name
     FROM evaluations ev JOIN users u2 ON ev.evaluator_id = u2.id
     WHERE ev.student_id = ? ORDER BY ev.created_at DESC`
  ).all(studentId);

  return { student, courses, works, reflections, evaluations };
}

// 档案导出页面
exports.showExport = (req, res) => {
  try {
    if (!isStaff(req.session.user.role)) {
      req.flash('error', '无权访问成长档案');
      return res.redirect('/dashboard');
    }

    const user = req.session.user;
    const tree = buildUserTree({
      search: req.query.search || '',
      schoolId: isTeacher(user.role) ? user.school_id : null
    });

    const courses = db.prepare('SELECT id, title FROM courses ORDER BY title').all();

    res.render('archives/tree', { title: '成长档案导出', tree, courses, filters: req.query });
  } catch (err) {
    console.error('导出页错误:', err);
    req.flash('error', '加载失败');
    res.redirect('/dashboard');
  }
};

// 生成档案
exports.generate = (req, res) => {
  try {
    const user = req.session.user;
    let studentId;

    if (user.role === 'student') {
      studentId = user.id;
    } else if (isStaff(user.role)) {
      studentId = req.query.student_id || user.id;
    } else {
      req.flash('error', '无权查看成长档案');
      return res.redirect('/dashboard');
    }

    const archive = loadStudentArchive(studentId);

    if (!archive) {
      req.flash('error', '学生不存在');
      return res.redirect('/archives');
    }

    if (isTeacher(user.role) && archive.student.school_id !== user.school_id) {
      req.flash('error', '无权查看其他学校学生档案');
      return res.redirect('/archives');
    }

    res.render('archives/result', {
      title: `${archive.student.real_name} - 成长档案`,
      ...archive,
      generatedAt: new Date().toLocaleString('zh-CN')
    });
  } catch (err) {
    console.error('生成档案错误:', err);
    req.flash('error', '生成失败');
    res.redirect('/archives');
  }
};

exports.generateBatch = (req, res) => {
  try {
    if (!isStaff(req.session.user.role)) {
      req.flash('error', '无权访问成长档案');
      return res.redirect('/dashboard');
    }

    const { school_id, class_id, search } = req.query;
    const user = req.session.user;
    if (isTeacher(user.role)) {
      let allowed = false;
      if (class_id) {
        const cls = db.prepare('SELECT school_id FROM classes WHERE id = ?').get(class_id);
        allowed = !!cls && cls.school_id === user.school_id;
      } else if (school_id) {
        allowed = Number(school_id) === user.school_id;
      }
      if (!allowed) {
        req.flash('error', '教师只能导出本校学生档案');
        return res.redirect('/archives');
      }
    }
    if (!school_id && !class_id) {
      req.flash('error', '请选择学校或班级');
      return res.redirect('/archives');
    }

    const params = [];
    let sql = "SELECT id FROM users WHERE role = 'student'";
    if (class_id) {
      sql += ' AND class_id = ?';
      params.push(class_id);
    } else {
      sql += ' AND school_id = ?';
      params.push(school_id);
    }
    if (search) {
      sql += ' AND (real_name LIKE ? OR username LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    sql += ' ORDER BY real_name';

    const studentRows = db.prepare(sql).all(...params);
    const archives = studentRows.map((row) => loadStudentArchive(row.id)).filter(Boolean);

    let scopeName = '批量成长档案';
    if (class_id) {
      const cls = db.prepare(`
        SELECT c.name as class_name, s.name as school_name
        FROM classes c
        JOIN schools s ON s.id = c.school_id
        WHERE c.id = ?
      `).get(class_id);
      scopeName = cls ? `${cls.school_name} - ${cls.class_name}` : '所选班级';
    } else if (school_id) {
      const school = db.prepare('SELECT name FROM schools WHERE id = ?').get(school_id);
      scopeName = school ? school.name : '所选学校';
    }

    res.render('archives/result_batch', {
      title: `${scopeName} - 批量成长档案`,
      archives,
      scopeName,
      generatedAt: new Date().toLocaleString('zh-CN')
    });
  } catch (err) {
    console.error('批量生成档案错误:', err);
    req.flash('error', '批量导出失败');
    res.redirect('/archives');
  }
};

// 反思日志页面
exports.showReflection = (req, res) => {
  try {
    if (['admin', 'teacher'].includes(req.session.user.role)) {
      req.flash('error', '教师不提交反思日志');
      return res.redirect('/dashboard');
    }

    const userId = req.session.user.id;
    let enrollments = [];
    let isMentor = false;

    if (isStaff(req.session.user.role)) {
      isMentor = true;
      let sql = `
        SELECT e.id as enrollment_id, c.id as course_id, c.title as course_title,
               u.real_name as student_name, u.id as student_id
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        JOIN users u ON e.student_id = u.id
      `;
      const params = [];
      if (isTeacher(req.session.user.role)) {
        sql += ' WHERE u.school_id = ?';
        params.push(req.session.user.school_id || 0);
      }
      sql += ' ORDER BY u.real_name';
      enrollments = db.prepare(sql).all(...params);
    } else {
      enrollments = db.prepare(
        `SELECT e.id as enrollment_id, c.id as course_id, c.title as course_title
         FROM enrollments e JOIN courses c ON e.course_id = c.id
         WHERE e.student_id = ?`
      ).all(userId);
    }

    res.render('archives/reflection', { title: '填写反思日志', enrollments, isMentor });
  } catch (err) {
    console.error('加载反思页错误:', err);
    req.flash('error', '加载失败');
    res.redirect('/dashboard');
  }
};

// 提交反思日志（每人每日限量1篇）
exports.submitReflection = (req, res) => {
  try {
    if (['admin', 'teacher'].includes(req.session.user.role)) {
      req.flash('error', '教师不提交反思日志');
      return res.redirect('/dashboard');
    }

    const { enrollment_id, lesson_id, difficulty, solution, improvement, new_question, student_id } = req.body;
    const user = req.session.user;
    const staff = isStaff(user.role);

    if (staff && !student_id) {
      req.flash('error', '请选择学生');
      return res.redirect('/archives/reflection');
    }

    const actualStudentId = staff ? student_id : user.id;
    const student = db.prepare(
      "SELECT id, school_id FROM users WHERE id = ? AND role = 'student'"
    ).get(actualStudentId);

    if (!student) {
      req.flash('error', '所选学生不存在');
      return res.redirect('/archives/reflection');
    }

    if (isTeacher(user.role) && student.school_id !== user.school_id) {
      req.flash('error', '教师只能为本校学生提交反思日志');
      return res.redirect('/archives/reflection');
    }

    let enrollmentCourseId = null;
    if (enrollment_id) {
      const enrollment = db.prepare(
        'SELECT id, course_id FROM enrollments WHERE id = ? AND student_id = ?'
      ).get(enrollment_id, actualStudentId);
      if (!enrollment) {
        req.flash('error', '所选课程报名记录不属于该学生');
        return res.redirect('/archives/reflection');
      }
      enrollmentCourseId = enrollment.course_id;
    }

    if (lesson_id) {
      const lesson = db.prepare('SELECT id, course_id FROM lessons WHERE id = ?').get(lesson_id);
      if (!lesson || (enrollmentCourseId && lesson.course_id !== enrollmentCourseId)) {
        req.flash('error', '所选课时不属于当前课程');
        return res.redirect('/archives/reflection');
      }
    }

    const submit = db.transaction((studentId) => {
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayCount = db.prepare(
        'SELECT COUNT(*) as count FROM reflections WHERE student_id = ? AND date(created_at) = ?'
      ).get(studentId, todayStr);

      if (todayCount.count >= 1) {
        return false;
      }

      db.prepare(
        `INSERT INTO reflections (student_id, enrollment_id, lesson_id, difficulty, solution, improvement, new_question)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(studentId, enrollment_id || null, lesson_id || null,
            difficulty || null, solution || null, improvement || null, new_question || null);
      return true;
    });

    if (!submit(actualStudentId)) {
      req.flash('error', '今日已提交过反思日志，每人每日限提交1篇。明天再来吧！');
      return res.redirect('/archives/reflection');
    }

    req.flash('success', '反思日志提交成功！');
    res.redirect('/archives/reflection');
  } catch (err) {
    console.error('提交反思错误:', err);
    req.flash('error', '提交失败');
    res.redirect('/archives/reflection');
  }
};

// 提交评价
exports.submitEvaluation = (req, res) => {
  try {
    const { student_id, enrollment_id, eval_type, score, comment } = req.body;

    if (!isStaff(req.session.user.role)) {
      req.flash('error', '无权提交评价');
      return res.redirect('/dashboard');
    }

    const student = db.prepare(
      "SELECT id, school_id FROM users WHERE id = ? AND role = 'student'"
    ).get(student_id);

    if (!student) {
      req.flash('error', '学生不存在');
      return res.redirect('back');
    }

    if (isTeacher(req.session.user.role) && student.school_id !== req.session.user.school_id) {
      req.flash('error', '教师只能评价本校学生');
      return res.redirect('back');
    }

    if (enrollment_id) {
      const enrollment = db.prepare(
        'SELECT id FROM enrollments WHERE id = ? AND student_id = ?'
      ).get(enrollment_id, student_id);
      if (!enrollment) {
        req.flash('error', '课程报名记录不属于该学生');
        return res.redirect('back');
      }
    }

    const allowedEvalTypes = ['process', 'outcome', 'peer', 'self'];
    const finalEvalType = allowedEvalTypes.includes(eval_type) ? eval_type : 'process';

    if (score && (!Number.isInteger(Number(score)) || Number(score) < 1 || Number(score) > 100)) {
      req.flash('error', '评分需为1-100的整数');
      return res.redirect('back');
    }

    db.prepare(
      `INSERT INTO evaluations (evaluator_id, student_id, enrollment_id, eval_type, score, comment)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(req.session.user.id, student_id, enrollment_id || null,
          finalEvalType, score || null, comment || null);

    req.flash('success', '评价提交成功！');
    res.redirect(`/students/${student_id}`);
  } catch (err) {
    console.error('提交评价错误:', err);
    req.flash('error', '提交失败');
    res.redirect('back');
  }
};
