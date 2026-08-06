# PBL 科创育人平台

面向“大中小贯通科创育人”项目的 PBL 数字化平台。平台以学校、班级、用户、课程、作品和成长档案为核心，提供学生选课与作品提交、教师/导师管理、管理员用户与学校管理、成长档案导出等能力。

## 功能概览

- 学生注册：使用“姓名 + 密码”登录，注册时必须选择学校与班级。
- 课程管理：创建课程、课时、任务、课程资源，学生可自主选课（最多 3 门）。
- 作品管理：学生上传作品，教师/导师管理本校或全部学生作品，管理员可打回或删除作品。
- 成长档案：按“学校 -> 班级 -> 身份 -> 姓名”树形展示，支持单人或按学校/班级批量导出。
- 用户管理：管理员按树形结构管理用户，支持添加、编辑、删除、批量导入、批量删除。
- 学校管理：管理员可在工作台添加/删除学校，进入学校详情后管理班级。
- 反思日志：学生可填写反思日志，管理员和教师不提交反思日志。
- AI 学习助手：内置基于关键词规则的问答入口，可关联课程上下文。

## 角色权限

| 角色 | 主要权限 |
| --- | --- |
| 管理员 | 平台全部功能：学校/班级/用户管理、课程管理、作品打回/删除、档案导出 |
| 执行导师 | 管理所有学生，管理自己创建的课程 |
| 学术导师 | 管理所有学生，管理自己创建的课程 |
| 教师 | 管理本校学生，可对本校学生增删改；只能查看课程；可查看公开发布课程对应的作品 |
| 学生 | 注册、选课、上传作品、填写反思日志、查看自己的成长档案 |
| 新媒体 | 预留角色，当前无专属管理入口 |

## 技术栈

- Node.js
- Express 4
- EJS
- SQLite + better-sqlite3
- express-session
- bcryptjs
- multer
- dotenv

## 快速开始

### 环境要求

- Node.js 18 或更高版本
- npm

### 安装与启动

```bash
cd backend
npm install
cp .env.example .env
npm run db:init
npm start
```

访问 `http://localhost:3000`。

### 数据库初始化

- `npm run db:init`：仅在数据库不存在时初始化。
- `npm run db:reset`：显式删除并重建数据库，会清空所有数据。

数据库文件位于 `backend/database/pbl_platform.db`，上传文件默认位于 `backend/uploads/`。

## 环境变量

在 `backend/.env` 中配置：

| 变量 | 说明 | 示例 |
| --- | --- | --- |
| `PORT` | 服务端口 | `3000` |
| `SESSION_SECRET` | 会话密钥，生产环境必须替换 | 长随机字符串 |
| `UPLOAD_PATH` | 上传目录 | `./uploads` |
| `NODE_ENV` | 运行环境 | `development` / `production` |

生产环境必须设置独立的 `SESSION_SECRET`，并修改所有默认账号密码。

## 默认测试账号

登录使用“姓名 + 密码”，不是用户名。

| 身份 | 姓名 | 密码 |
| --- | --- | --- |
| 管理员 | 管理员 | `admin123` |
| 执行导师 | 张导师 | `mentor123` |
| 教师 | 李老师 | `teacher123` |
| 学生 | 王小明 | `student123` |

## 主要目录

```text
backend/
  app.js                 # Express 入口
  config/database.js     # SQLite 连接与轻量迁移
  controllers/           # 业务控制器
  routes/                # 路由
  middleware/            # 鉴权与上传
  helpers/               # 用户树等公共逻辑
  views/                 # EJS 页面
  public/                # 静态资源
  database/schema.sql    # 数据库表结构
  database/init.js       # 初始化脚本
  uploads/               # 上传文件目录
```

## 主要路由

| 路由 | 说明 |
| --- | --- |
| `/auth/login`、`/auth/register` | 登录、注册 |
| `/dashboard` | 工作台 |
| `/dashboard/schools/add`、`/dashboard/schools/:id` | 学校新增与详情 |
| `/courses` | 课程管理 |
| `/students` | 学生/用户管理 |
| `/works` | 作品管理 |
| `/archives` | 成长档案 |
| `/archives/reflection` | 反思日志 |
| `/dashboard/ai` | AI 学习助手 |

## 开源说明

- 当前仓库默认不提交 `.env`、SQLite 数据库文件和上传文件。
- 如果你公开部署，请先修改默认密码并替换 `SESSION_SECRET`。
- 当前尚未包含自动化测试；CSRF token 和登录限流也仍建议在上线前补充。
- 如需指定开源许可证，请在仓库中添加 `LICENSE` 文件。

## 贡献

欢迎通过 Issue 提交问题，通过 Pull Request 提交改进。请保持改动范围聚焦，并同步补充必要的说明。
