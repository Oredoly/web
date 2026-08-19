# PBL 科创育人平台前端

本目录是 PBL 科创育人平台的 React 单页应用，使用 Vite 开发和构建。

## 技术栈

- React 19
- Vite 8
- Ant Design 6
- React Router 7
- Axios
- Day.js
- ESLint 10

## 环境要求

- Node.js 22.12 或更高版本
- npm 10 或更高版本

## 安装

```powershell
cd frontend
npm ci
```

## 本地运行

请先在另一个终端启动 `backend` 服务，然后执行：

```powershell
npm run dev
```

前端默认运行在 `http://localhost:5173`。

当前没有配置 Vite API 代理。Axios 在 `src/api/client.js` 中直接请求 `http://localhost:3000/api`，因此本地后端应运行在 3000 端口。

## 命令

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动开发服务器 |
| `npm run lint` | 执行 ESLint 检查 |
| `npm run build` | 构建生产文件到 `dist` |
| `npm run preview` | 本地预览构建结果 |

## 入口与目录

```text
index.html
└── src/main.jsx
    └── src/App.jsx
        ├── api/          # Axios 客户端与模块 API
        ├── components/   # 布局、反馈等公共组件
        ├── constants/    # 反馈状态、类型和优先级字典
        ├── pages/        # 页面组件
        └── store/        # 认证状态
```

## 当前页面路由

路由定义以 `src/App.jsx` 为准，主要包括：

- `/login`、`/register`
- `/dashboard`、`/dashboard/schools/:id`、`/dashboard/ai`
- `/courses`、`/courses/create`、`/courses/:id`、`/courses/:id/edit`
- `/students`、`/students/:id`
- `/works`、`/works/upload`、`/works/:id`
- `/archives`、`/archives/reflection`
- `/feedback`、`/feedback/new`、`/feedback/:id`
- `/feedback/manage`（仅管理员）

反馈页面支持提交、筛选、分页、公开回复、私有附件下载、用户确认、重新处理以及管理员状态、优先级、处理结果和内部备注。

`/dashboard/schools/add` 和 `/students/import` 暂无对应的 React 路由，虽然部分按钮仍会导航到这两个地址。

## 已知限制

- API 地址尚未通过环境变量配置。
- ESLint 当前仍有未处理的 Hooks 和未使用导入问题。
- 尚无前端自动化测试；反馈服务的后端测试位于 `backend/test`。
- `src/assets/vite.svg`、`public/icons.svg` 等模板资源目前未被页面使用。
