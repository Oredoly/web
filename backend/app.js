require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const ejsLayouts = require('express-ejs-layouts');
const { injectUser } = require('./middleware/auth');
const { UPLOAD_ROOT } = require('./middleware/upload');

const app = express();
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is required in production');
}

const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

// ============================================
// 中间件配置
// ============================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');
app.use(ejsLayouts);
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_ROOT, {
  dotfiles: 'deny',
  index: false,
  fallthrough: false,
  setHeaders(res, filePath) {
    if (!/\.(png|jpe?g|gif|webp|mp4|webm)$/i.test(filePath)) {
      res.setHeader('Content-Disposition', 'attachment');
    }
  }
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24小时
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));

app.use(flash());
app.use(injectUser);

// ============================================
// 路由
// ============================================
app.use('/auth', require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/courses', require('./routes/courses'));
app.use('/students', require('./routes/students'));
app.use('/works', require('./routes/works'));
app.use('/archives', require('./routes/archives'));

// 首页重定向
app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.redirect('/auth/login');
});

// 404
app.use((req, res) => {
  res.status(404).render('error', {
    title: '页面未找到',
    message: '您访问的页面不存在',
    error: { status: 404 }
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(err.status || 500).render('error', {
    title: '服务器错误',
    message: err.message || '服务器内部错误',
    error: { status: err.status || 500, stack: process.env.NODE_ENV === 'development' ? err.stack : '' }
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 PBL 数字化平台已启动: http://localhost:${PORT}`);
  console.log('📋 环境:', process.env.NODE_ENV || 'development');
});
