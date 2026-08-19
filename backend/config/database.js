const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH
  ? path.resolve(__dirname, '..', process.env.DB_PATH)
  : path.join(__dirname, '..', 'database', 'pbl_platform.db');
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

// 反馈模块兼容迁移：应用启动时为已有数据库补齐表和索引。
db.exec(`
  CREATE TABLE IF NOT EXISTS feedbacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feedback_no TEXT UNIQUE,
    user_id INTEGER,
    type TEXT NOT NULL CHECK(type IN ('suggestion','bug','question','content','other')),
    module TEXT CHECK(module IS NULL OR module IN ('auth','dashboard','courses','students','works','archives','assistant','other')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    contact TEXT,
    allow_contact INTEGER NOT NULL DEFAULT 1 CHECK(allow_contact IN (0, 1)),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','waiting_user','resolved','closed','rejected')),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low','normal','high','urgent')),
    resolution TEXT,
    source_path TEXT,
    client_info TEXT,
    satisfaction INTEGER CHECK(satisfaction IS NULL OR satisfaction BETWEEN 1 AND 5),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    closed_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS feedback_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feedback_id INTEGER NOT NULL,
    sender_id INTEGER,
    message_type TEXT NOT NULL DEFAULT 'reply' CHECK(message_type IN ('reply','note','system')),
    content TEXT NOT NULL,
    is_internal INTEGER NOT NULL DEFAULT 0 CHECK(is_internal IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feedback_id) REFERENCES feedbacks(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS feedback_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feedback_id INTEGER NOT NULL,
    message_id INTEGER,
    original_name TEXT NOT NULL,
    stored_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feedback_id) REFERENCES feedbacks(id) ON DELETE CASCADE,
    FOREIGN KEY (message_id) REFERENCES feedback_messages(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_feedbacks_user ON feedbacks(user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status, priority, updated_at DESC);
  CREATE INDEX IF NOT EXISTS idx_feedback_messages_feedback ON feedback_messages(feedback_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_feedback_attachments_feedback ON feedback_attachments(feedback_id);
`);

console.log('✅ SQLite 数据库连接成功:', dbPath);

module.exports = db;
