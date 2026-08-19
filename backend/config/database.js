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
if (!workColumns.includes('parent_work_id')) db.exec('ALTER TABLE works ADD COLUMN parent_work_id INTEGER');
if (!workColumns.includes('version')) db.exec('ALTER TABLE works ADD COLUMN version INTEGER DEFAULT 1');
db.exec(`CREATE TABLE IF NOT EXISTS work_reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, work_id INTEGER NOT NULL UNIQUE, reviewer_id INTEGER NOT NULL, comment TEXT, suggestion TEXT, problem_discovery INTEGER NOT NULL, solution_design INTEGER NOT NULL, hands_on INTEGER NOT NULL, data_analysis INTEGER NOT NULL, presentation INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(work_id) REFERENCES works(id) ON DELETE CASCADE, FOREIGN KEY(reviewer_id) REFERENCES users(id)); CREATE TABLE IF NOT EXISTS growth_records (id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL, event_type TEXT NOT NULL DEFAULT 'teacher', description TEXT NOT NULL, recorded_by INTEGER, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY(recorded_by) REFERENCES users(id));`);

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

const taskColumns = db.prepare('PRAGMA table_info(tasks)').all().map((c) => c.name);
if (!taskColumns.includes('deadline')) db.exec('ALTER TABLE tasks ADD COLUMN deadline DATETIME');
db.exec(`CREATE TABLE IF NOT EXISTS lesson_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  lesson_id INTEGER NOT NULL,
  progress INTEGER DEFAULT 0 CHECK(progress BETWEEN 0 AND 100),
  last_position INTEGER DEFAULT 0,
  completed_at DATETIME,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  UNIQUE(student_id, lesson_id)
);`);

console.log('✅ SQLite 数据库连接成功:', dbPath);

module.exports = db;
