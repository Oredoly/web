require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const path = require('path');
const { UPLOAD_ROOT } = require('./middleware/upload');

const app = express();
const PORT = process.env.PORT || 3000;
const API_PREFIX = process.env.API_PREFIX || '/api';

// ============================================
// JWT 密钥
// ============================================
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required in production');
}
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
app.set('jwt_secret', JWT_SECRET);

// ============================================
// 中间件配置
// ============================================
app.disable('x-powered-by');
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 静态文件（上传目录）
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

// ============================================
// API 路由
// ============================================
app.use(`${API_PREFIX}/auth`, require('./routes/auth'));
app.use(`${API_PREFIX}/dashboard`, require('./routes/dashboard'));
app.use(`${API_PREFIX}/courses`, require('./routes/courses'));
app.use(`${API_PREFIX}/students`, require('./routes/students'));
app.use(`${API_PREFIX}/works`, require('./routes/works'));
app.use(`${API_PREFIX}/archives`, require('./routes/archives'));
app.use(`${API_PREFIX}/feedback`, require('./routes/feedback'));
app.use(`${API_PREFIX}/notifications`, require('./routes/notifications'));

// 健康检查
app.get(`${API_PREFIX}/health`, (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: '请求的资源不存在' });
});

// 全局错误处理
app.use((err, req, res, _next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误', message: process.env.NODE_ENV === 'development' ? err.message : '请稍后重试' });
});

app.listen(PORT, () => {
  console.log(`🚀 PBL API 服务器启动: http://localhost:${PORT}${API_PREFIX}`);
  console.log(`📝 前端开发地址: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
});

module.exports = app;
