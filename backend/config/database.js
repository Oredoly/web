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

console.log('✅ SQLite 数据库连接成功:', dbPath);

module.exports = db;
