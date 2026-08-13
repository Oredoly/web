# PBL 科创育人平台

面向「大中小贯通科创育人」项目的 PBL（项目式学习）数字化管理平台。平台以学校、班级、用户、课程、作品和成长档案为核心，提供学生选课与作品提交、教师/导师管理、管理员用户与学校管理、成长档案导出、AI 学习助手等功能。

## 技术架构

本项目采用前后端分离架构：

| 层级 | 技术栈 |
| --- | --- |
| **前端** | React 19 + Vite 8 + Ant Design 6 + React Router 7 + Axios |
| **后端** | Node.js + Express 4（RESTful API） |
| **数据库** | SQLite + better-sqlite3 |
| **认证** | JWT（JSON Web Token） |

## 功能概览

- **用户认证**：使用「姓名 + 密码」登录/注册，支持 JWT Token 鉴权，注册时必须选择学校与班级。
- **课程管理**：创建/编辑课程、课时、任务、课程资源，学生可自主选课（最多 3 门）。
- **作品管理**：学生上传作品，教师/导师管理本校或全部学生作品，管理员可打回或删除作品。
- **成长档案**：按「学校 → 班级 → 身份 → 姓名」树形展示，支持单人或按学校/班级批量导出。
- **用户管理**：管理员按树形结构管理用户，支持添加、编辑、删除、批量导入、批量删除。
- **学校管理**：管理员可在工作台添加/删除学校，进入学校详情后管理班级。
- **反思日志**：学生可填写反思日志，管理员和教师可查看。
- **AI 学习助手**：内置智能问答入口，可关联课程上下文，辅助学生学习。

## 角色权限

| 角色 | 主要权限 |
| --- | --- |
| 管理员（admin） | 平台全部功能：学校/班级/用户管理、课程管理、作品打回/删除、档案导出 |
| 执行导师（executive_mentor） | 管理所有学生，管理自己创建的课程 |
| 学术导师（academic_mentor） | 管理所有学生，管理自己创建的课程 |
| 教师（teacher） | 管理本校学生，可对本校学生增删改；查看课程；查看公开发布课程对应的作品 |
| 学生（student） | 注册、选课、上传作品、填写反思日志、查看自己的成长档案 |
| 新媒体（media） | 预留角色，当前无专属管理入口 |

## 快速开始

### 环境要求

- Node.js 18 或更高版本
- npm

### 1. 启动后端

```bash
cd backend
npm install
cp .env.example .env    # 编辑 .env 配置环境变量
npm run db:init          # 初始化数据库（含默认测试数据）
npm run dev              # 开发模式启动（nodemon 热重载）
```

后端 API 服务默认运行在 `http://localhost:3000`，API 前缀为 `/api`。

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev              # Vite 开发服务器启动
```

前端开发服务器默认运行在 `http://localhost:5173`，会自动代理 API 请求到后端。

### 数据库管理

| 命令 | 说明 |
| --- | --- |
| `npm run db:init` | 仅在数据库不存在时初始化（含默认测试数据） |
| `npm run db:reset` | 删除并重建数据库，**会清空所有数据** |

数据库文件位于 `backend/database/pbl_platform.db`，上传文件默认位于 `backend/uploads/`。

## 环境变量

在 `backend/.env` 中配置：

| 变量 | 说明 | 示例 |
| --- | --- | --- |
| `PORT` | API 服务端口 | `3000` |
| `JWT_SECRET` | JWT 签名密钥，生产环境**必须**设置 | 长随机字符串 |
| `UPLOAD_PATH` | 上传文件目录 | `./uploads` |
| `NODE_ENV` | 运行环境 | `development` / `production` |
| `CORS_ORIGIN` | 允许的前端跨域来源 | `http://localhost:5173` |
| `API_PREFIX` | API 路由前缀 | `/api` |

> ⚠️ 生产环境必须设置独立的 `JWT_SECRET`，并修改所有默认账号密码。

## 默认测试账号

登录使用「姓名 + 密码」：

| 身份 | 姓名 | 密码 |
| --- | --- | --- |
| 管理员 | 管理员 | `admin123` |
| 执行导师 | 张导师 | `mentor123` |
| 教师 | 李老师 | `teacher123` |
| 学生 | 王小明 | `student123` |

## API 接口

| 模块 | 前缀 | 说明 |
| --- | --- | --- |
| 认证 | `/api/auth` | 登录、注册、获取当前用户信息 |
| 工作台 | `/api/dashboard` | 统计概览、学校管理、AI 助手 |
| 课程 | `/api/courses` | 课程 CRUD、选课、资源管理 |
| 学生 | `/api/students` | 用户管理、批量导入/删除 |
| 作品 | `/api/works` | 作品上传、审核、打回/删除 |
| 档案 | `/api/archives` | 成长档案树、反思日志、批量导出 |
| 健康检查 | `/api/health` | 服务状态检查 |

## 项目目录

```text
web/
├── backend/                    # 后端 API 服务
│   ├── app.js                  # Express 入口，中间件与路由挂载
│   ├── config/database.js      # SQLite 连接与轻量迁移
│   ├── controllers/            # 业务控制器
│   │   ├── authController.js   #   认证（登录/注册/JWT）
│   │   ├── dashboardController.js  #   工作台与 AI 助手
│   │   ├── courseController.js #   课程管理
│   │   ├── studentController.js#   学生/用户管理
│   │   ├── workController.js   #   作品管理
│   │   ├── archiveController.js#   成长档案
│   │   └── aiController.js     #   AI 问答
│   ├── routes/                 # 路由定义
│   ├── middleware/              # 鉴权（JWT）与文件上传
│   ├── helpers/                # 用户树等公共逻辑
│   ├── database/
│   │   ├── schema.sql          # 数据库表结构
│   │   └── init.js             # 数据库初始化脚本
│   └── uploads/                # 上传文件存储目录
│
└── frontend/                   # 前端 SPA 应用
    ├── index.html              # HTML 入口
    ├── vite.config.js          # Vite 构建配置
    └── src/
        ├── main.jsx            # React 入口
        ├── App.jsx             # 路由配置
        ├── api/                # API 请求封装
        │   ├── client.js       #   Axios 实例（拦截器/Token 注入）
        │   └── index.js        #   各模块 API 函数
        ├── components/         # 公共组件
        │   ├── AppLayout.jsx   #   应用布局（侧边栏+头部）
        │   ├── Header.jsx      #   顶部导航栏
        │   └── Sidebar.jsx     #   侧边栏菜单
        ├── pages/              # 页面组件
        │   ├── auth/           #   登录/注册
        │   ├── dashboard/      #   工作台、学校管理、AI 助手
        │   ├── courses/        #   课程列表、详情、创建/编辑
        │   ├── students/       #   学生列表、详情
        │   ├── works/          #   作品列表、详情、上传
        │   └── archives/       #   成长档案、反思日志
        └── store/
            └── AuthContext.jsx #   全局认证状态管理
```

## 构建部署

### 前端构建

```bash
cd frontend
npm run build      # 产物输出到 frontend/dist/
npm run preview    # 本地预览构建产物
```

### 后端生产启动

```bash
cd backend
NODE_ENV=production npm start
```

## License

本项目仅供「大中小贯通科创育人」项目组内部使用。
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

## 作品管理与成长档案补充（2026-08）

- 作品管理新增学生待办任务、课程筛选、作品版本重交和历史版本查看。
- 作品详情新增教师评语、修改建议、五维能力评分及通过/需修改状态处理。
- 成长档案新增五维平均能力展示、系统/教师成长记录，并支持教师通过浏览器打印导出 PDF。
- 边界处理：仅允许作品本人重交被退回的作品；教师仅可批改、记录本校学生；无批改数据时能力分显示为 0。
