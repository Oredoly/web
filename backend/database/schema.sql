-- ============================================
-- PBL 数字化平台 SQLite 数据库初始化
-- ============================================

-- 1. 学校表
CREATE TABLE IF NOT EXISTS schools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT,
  region TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 班级表
CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  school_id INTEGER NOT NULL,
  grade TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
);

-- 3. 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  real_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  profile TEXT,
  role TEXT NOT NULL CHECK(role IN ('admin','academic_mentor','executive_mentor','teacher','student','media')),
  school_id INTEGER,
  class_id INTEGER,
  avatar_url TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
);

-- 4. 实践队
CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  leader_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role_in_team TEXT,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(team_id, user_id)
);

-- 5. PBL 课程
CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  theme TEXT,
  description TEXT,
  driving_question TEXT,
  story_line TEXT,
  grade_level TEXT NOT NULL CHECK(grade_level IN ('primary','junior','senior')),
  difficulty TEXT NOT NULL CHECK(difficulty IN ('basic','advanced','challenge')),
  total_hours INTEGER,
  materials_needed TEXT,
  cover_image TEXT,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 6. 课时
CREATE TABLE IF NOT EXISTS lessons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  duration INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- 7. 任务
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lesson_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT DEFAULT 'inquiry' CHECK(task_type IN ('inquiry','experiment','creation','reflection','presentation')),
  sort_order INTEGER DEFAULT 0,
  require_upload INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

-- 8. 课程资源
CREATE TABLE IF NOT EXISTS resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id INTEGER NOT NULL,
  resource_type TEXT NOT NULL CHECK(resource_type IN ('lesson_plan','guide_card','template','courseware','video','other')),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  file_size INTEGER,
  upload_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (upload_by) REFERENCES users(id)
);

-- 9. 微课题
CREATE TABLE IF NOT EXISTS micro_projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  background TEXT,
  description TEXT,
  difficulty_level TEXT NOT NULL CHECK(difficulty_level IN ('1','2','3')),
  suggested_grade TEXT NOT NULL CHECK(suggested_grade IN ('primary','junior','senior')),
  estimated_hours INTEGER,
  source_research TEXT,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','published','recruiting','in_progress','review','completed','archived')),
  mentor_id INTEGER NOT NULL,
  academic_mentor_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mentor_id) REFERENCES users(id),
  FOREIGN KEY (academic_mentor_id) REFERENCES users(id)
);

-- 10. 微课题小组
CREATE TABLE IF NOT EXISTS project_teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  micro_project_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  leader_student_id INTEGER NOT NULL,
  status TEXT DEFAULT 'forming' CHECK(status IN ('forming','active','completed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (micro_project_id) REFERENCES micro_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (leader_student_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS project_team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  role_in_team TEXT,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES project_teams(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(team_id, student_id)
);

-- 11. 课程参与记录
CREATE TABLE IF NOT EXISTS enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE(student_id, course_id)
);

-- 12. 学生作品
CREATE TABLE IF NOT EXISTS works (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  enrollment_id INTEGER,
  task_id INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  file_type TEXT,
  file_size INTEGER,
  thumbnail_path TEXT,
  review_status TEXT DEFAULT 'pending' CHECK(review_status IN ('pending','approved','rejected')),
  reject_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE SET NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

-- 13. 反思日志
CREATE TABLE IF NOT EXISTS reflections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  enrollment_id INTEGER,
  lesson_id INTEGER,
  difficulty TEXT,
  solution TEXT,
  improvement TEXT,
  new_question TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE SET NULL,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL
);

-- 14. 评价
CREATE TABLE IF NOT EXISTS evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  evaluator_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  enrollment_id INTEGER,
  eval_type TEXT NOT NULL CHECK(eval_type IN ('process','outcome','peer','self')),
  score INTEGER,
  comment TEXT,
  dimensions TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE SET NULL
);

-- 15. 微课题里程碑
CREATE TABLE IF NOT EXISTS project_milestones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  micro_project_id INTEGER NOT NULL,
  team_id INTEGER,
  title TEXT NOT NULL,
  content TEXT,
  next_steps TEXT,
  recorded_by INTEGER NOT NULL,
  meeting_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (micro_project_id) REFERENCES micro_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES project_teams(id) ON DELETE SET NULL,
  FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- 16. 素材共享库
CREATE TABLE IF NOT EXISTS media_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK(asset_type IN ('image','video','document','other')),
  file_path TEXT NOT NULL,
  file_size INTEGER,
  course_id INTEGER,
  school_id INTEGER,
  tags TEXT,
  upload_by INTEGER NOT NULL,
  usage_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL,
  FOREIGN KEY (upload_by) REFERENCES users(id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_school ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_courses_theme ON courses(theme);
CREATE INDEX IF NOT EXISTS idx_courses_grade ON courses(grade_level);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_works_student ON works(student_id);
CREATE INDEX IF NOT EXISTS idx_reflections_student ON reflections(student_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_student ON evaluations(student_id);
