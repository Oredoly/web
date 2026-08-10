const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const PUBLIC_ROLES = ['student'];

function generateToken(user, secret) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      real_name: user.real_name,
      role: user.role,
      school_id: user.school_id,
      class_id: user.class_id
    },
    secret,
    { expiresIn: '24h' }
  );
}

// 获取学校列表（注册用）
exports.getSchools = (req, res) => {
  try {
    const schools = db.prepare('SELECT id, name FROM schools ORDER BY name').all();
    res.json({ schools });
  } catch (err) {
    console.error('获取学校列表错误:', err);
    res.status(500).json({ error: '获取学校列表失败' });
  }
};

// 获取班级列表
exports.getClasses = (req, res) => {
  try {
    const { school_id } = req.query;
    let classes = [];
    if (school_id) {
      classes = db.prepare('SELECT id, name, grade FROM classes WHERE school_id = ? ORDER BY grade, name').all(school_id);
    }
    res.json({ classes });
  } catch (err) {
    console.error('获取班级列表错误:', err);
    res.status(500).json({ error: '获取班级列表失败' });
  }
};

// 处理登录 → 返回 JWT
exports.login = (req, res) => {
  try {
    const realName = String(req.body.real_name || '').trim();
    const password = req.body.password;
    if (!realName || !password) {
      return res.status(400).json({ error: '请输入姓名和密码' });
    }

    const users = db.prepare(
      'SELECT id, username, password_hash, real_name, role, school_id, class_id FROM users WHERE real_name = ? AND is_active = 1'
    ).all(realName);

    if (users.length === 0) {
      return res.status(401).json({ error: '姓名或密码错误' });
    }
    if (users.length > 1) {
      return res.status(401).json({ error: '存在重名用户，请联系管理员' });
    }

    const user = users[0];
    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: '姓名或密码错误' });
    }

    const token = generateToken(user, req.app.get('jwt_secret'));

    res.json({
      message: `欢迎回来，${user.real_name}！`,
      token,
      user: {
        id: user.id,
        username: user.username,
        real_name: user.real_name,
        role: user.role,
        school_id: user.school_id,
        class_id: user.class_id
      }
    });
  } catch (err) {
    console.error('登录错误:', err);
    res.status(500).json({ error: '登录失败，请稍后重试' });
  }
};

// 处理注册
exports.register = (req, res) => {
  try {
    const { password, password_confirm, email, role, phone, school_id, class_id } = req.body;
    const real_name = String(req.body.real_name || '').trim();

    if (!PUBLIC_ROLES.includes(role)) {
      return res.status(400).json({ error: '公开注册仅支持学生账号' });
    }

    if (!real_name) {
      return res.status(400).json({ error: '请填写真实姓名' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ error: '密码至少6位' });
    }
    if (password !== password_confirm) {
      return res.status(400).json({ error: '两次密码输入不一致' });
    }

    if (!phone || !/^\d{11}$/.test(phone)) {
      return res.status(400).json({ error: '请输入正确的11位手机号' });
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: '请输入正确的邮箱地址' });
    }

    if (role === 'student' && (!school_id || !class_id)) {
      return res.status(400).json({ error: '学生必须选择学校和班级' });
    }

    if (class_id) {
      const cls = db.prepare('SELECT id FROM classes WHERE id = ? AND school_id = ?').get(class_id, school_id);
      if (!cls) {
        return res.status(400).json({ error: '所选班级不属于当前学校' });
      }
    }

    const existing = db.prepare('SELECT id FROM users WHERE real_name = ?').get(real_name);
    if (existing) {
      return res.status(400).json({ error: '该姓名已被使用，请换一个' });
    }

    const username = `user${Date.now()}${Math.floor(Math.random() * 100000)}`;
    const password_hash = bcrypt.hashSync(password, 10);
    db.prepare(
      `INSERT INTO users (username, password_hash, real_name, email, phone, role, school_id, class_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(username, password_hash, real_name, email || null, phone, role, school_id || null, class_id || null);

    res.json({ message: '注册成功，请登录' });
  } catch (err) {
    console.error('注册错误:', err);
    res.status(500).json({ error: '注册失败，请稍后重试' });
  }
};

// 获取当前用户信息
exports.me = (req, res) => {
  try {
    const user = db.prepare(
      'SELECT id, username, real_name, email, phone, role, school_id, class_id, avatar_url, is_active FROM users WHERE id = ?'
    ).get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 获取学校和班级名称
    let school_name = null, class_name = null;
    if (user.school_id) {
      const school = db.prepare('SELECT name FROM schools WHERE id = ?').get(user.school_id);
      if (school) school_name = school.name;
    }
    if (user.class_id) {
      const cls = db.prepare('SELECT name, grade FROM classes WHERE id = ?').get(user.class_id);
      if (cls) class_name = cls.name;
    }

    res.json({ user: { ...user, school_name, class_name } });
  } catch (err) {
    console.error('获取用户信息错误:', err);
    res.status(500).json({ error: '获取用户信息失败' });
  }
};
