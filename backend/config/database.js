const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'pbl_platform.db');
const db = new Database(dbPath);

// 开启 WAL 模式提升并发性能
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const workColumns = db.prepare('PRAGMA table_info(works)').all().map((c) => c.name);
if (!workColumns.includes('review_status')) {
  db.exec("ALTER TABLE works ADD COLUMN review_status TEXT DEFAULT 'pending'");
}
if (!workColumns.includes('reject_reason')) {
  db.exec('ALTER TABLE works ADD COLUMN reject_reason TEXT');
}

const schoolColumns = db.prepare('PRAGMA table_info(schools)').all().map((c) => c.name);
if (!schoolColumns.includes('description')) {
  db.exec('ALTER TABLE schools ADD COLUMN description TEXT');
}
if (!schoolColumns.includes('tags')) {
  db.exec('ALTER TABLE schools ADD COLUMN tags TEXT');
}

const userColumns = db.prepare('PRAGMA table_info(users)').all().map((c) => c.name);
if (!userColumns.includes('profile')) {
  db.exec('ALTER TABLE users ADD COLUMN profile TEXT');
}
// 负责教师 / 负责导师（管理员分配用）
if (!userColumns.includes('teacher_id')) {
  db.exec('ALTER TABLE users ADD COLUMN teacher_id INTEGER');
}
if (!userColumns.includes('mentor_id')) {
  db.exec('ALTER TABLE users ADD COLUMN mentor_id INTEGER');
}
// 强制修改密码标志：管理员重置密码后置 1，用户自助改密成功后置 0
if (!userColumns.includes('force_reset_password')) {
  db.exec('ALTER TABLE users ADD COLUMN force_reset_password INTEGER NOT NULL DEFAULT 0');
}

// 刷新令牌表（无感刷新 token 用）
db.exec(`
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

console.log('✅ SQLite 数据库连接成功:', dbPath);

module.exports = db;
