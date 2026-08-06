const bcrypt = require('bcryptjs');
const db = require('../config/database');

const PUBLIC_ROLES = ['student'];

// 登录页面
exports.showLogin = (req, res) => {
  res.render('auth/login', { title: '登录' });
};

// 处理登录
exports.login = (req, res) => {
  try {
    const realName = String(req.body.real_name || '').trim();
    const password = req.body.password;
    if (!realName || !password) {
      req.flash('error', '请输入姓名和密码');
      return res.redirect('/auth/login');
    }

    const users = db.prepare(
      'SELECT id, username, password_hash, real_name, role, school_id, class_id FROM users WHERE real_name = ? AND is_active = 1'
    ).all(realName);

    if (users.length === 0 || users.length > 1) {
      req.flash('error', '姓名不存在或存在重名，请联系管理员');
      return res.redirect('/auth/login');
    }

    const user = users[0];
    const validPassword = bcrypt.compareSync(password, user.password_hash);
    if (!validPassword) {
      req.flash('error', '姓名或密码错误');
      return res.redirect('/auth/login');
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      real_name: user.real_name,
      role: user.role,
      school_id: user.school_id,
      class_id: user.class_id
    };

    req.flash('success', `欢迎回来，${user.real_name}！`);
    res.redirect('/dashboard');
  } catch (err) {
    console.error('登录错误:', err);
    req.flash('error', '登录失败，请稍后重试');
    res.redirect('/auth/login');
  }
};

// 注册页面
exports.showRegister = (req, res) => {
  const schools = db.prepare('SELECT id, name FROM schools ORDER BY name').all();
  res.render('auth/register', { title: '注册', schools });
};

// 处理注册
exports.register = (req, res) => {
  try {
    const { password, password_confirm, email, role, phone, school_id, class_id } = req.body;
    const real_name = String(req.body.real_name || '').trim();

    if (!PUBLIC_ROLES.includes(role)) {
      req.flash('error', '公开注册仅支持学生账号');
      return res.redirect('/auth/register');
    }

    if (!real_name) {
      req.flash('error', '请填写真实姓名');
      return res.redirect('/auth/register');
    }

    // 密码校验
    if (!password || password.length < 6) {
      req.flash('error', '密码至少6位');
      return res.redirect('/auth/register');
    }
    if (password !== password_confirm) {
      req.flash('error', '两次密码输入不一致');
      return res.redirect('/auth/register');
    }

    // 手机号校验
    if (!phone || !/^\d{11}$/.test(phone)) {
      req.flash('error', '请输入正确的11位手机号');
      return res.redirect('/auth/register');
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      req.flash('error', '请输入正确的邮箱地址');
      return res.redirect('/auth/register');
    }

    // 学生角色必须选择学校
    if (role === 'student' && (!school_id || !class_id)) {
      req.flash('error', '学生必须选择学校和班级');
      return res.redirect('/auth/register');
    }

    if (class_id) {
      const cls = db.prepare('SELECT id FROM classes WHERE id = ? AND school_id = ?').get(class_id, school_id);
      if (!cls) {
        req.flash('error', '所选班级不属于当前学校');
        return res.redirect('/auth/register');
      }
    }

    // 登录使用姓名，姓名需要保持唯一
    const existing = db.prepare('SELECT id FROM users WHERE real_name = ?').get(real_name);
    if (existing) {
      req.flash('error', '该姓名已被使用，请换一个');
      return res.redirect('/auth/register');
    }

    const username = `user${Date.now()}${Math.floor(Math.random() * 100000)}`;
    const password_hash = bcrypt.hashSync(password, 10);
    db.prepare(
      `INSERT INTO users (username, password_hash, real_name, email, phone, role, school_id, class_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(username, password_hash, real_name, email || null, phone, role, school_id || null, class_id || null);

    req.flash('success', '注册成功，请登录');
    res.redirect('/auth/login');
  } catch (err) {
    console.error('注册错误:', err);
    req.flash('error', '注册失败，请稍后重试');
    res.redirect('/auth/register');
  }
};

// 退出登录
exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/auth/login');
};
