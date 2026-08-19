import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  BookOutlined,
  TeamOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  FormOutlined,
  RobotOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { useAuth } from '../store/AuthContext';

const { Sider } = Layout;

const menuItems = {
  admin: [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台' },
    { key: '/courses', icon: <BookOutlined />, label: '课程管理' },
    { key: '/students', icon: <TeamOutlined />, label: '用户管理' },
    { key: '/works', icon: <FileTextOutlined />, label: '作品管理' },
    { key: '/archives', icon: <FolderOpenOutlined />, label: '成长档案' },
    { key: '/dashboard/ai', icon: <RobotOutlined />, label: 'AI 助手' },
    { key: '/feedback/manage', icon: <MessageOutlined />, label: '反馈管理' },
  ],
  executive_mentor: [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台' },
    { key: '/courses', icon: <BookOutlined />, label: '课程管理' },
    { key: '/students', icon: <TeamOutlined />, label: '学生管理' },
    { key: '/works', icon: <FileTextOutlined />, label: '作品管理' },
    { key: '/archives', icon: <FolderOpenOutlined />, label: '成长档案' },
    { key: '/dashboard/ai', icon: <RobotOutlined />, label: 'AI 助手' },
    { key: '/feedback', icon: <MessageOutlined />, label: '帮助与反馈' },
  ],
  academic_mentor: [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台' },
    { key: '/courses', icon: <BookOutlined />, label: '课程管理' },
    { key: '/students', icon: <TeamOutlined />, label: '学生管理' },
    { key: '/works', icon: <FileTextOutlined />, label: '作品管理' },
    { key: '/archives', icon: <FolderOpenOutlined />, label: '成长档案' },
    { key: '/dashboard/ai', icon: <RobotOutlined />, label: 'AI 助手' },
    { key: '/feedback', icon: <MessageOutlined />, label: '帮助与反馈' },
  ],
  teacher: [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台' },
    { key: '/courses', icon: <BookOutlined />, label: '课程浏览' },
    { key: '/students', icon: <TeamOutlined />, label: '学生管理' },
    { key: '/works', icon: <FileTextOutlined />, label: '作品管理' },
    { key: '/archives', icon: <FolderOpenOutlined />, label: '成长档案' },
    { key: '/dashboard/ai', icon: <RobotOutlined />, label: 'AI 助手' },
    { key: '/feedback', icon: <MessageOutlined />, label: '帮助与反馈' },
  ],
  student: [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '我的工作台' },
    { key: '/courses', icon: <BookOutlined />, label: '课程中心' },
    { key: '/works', icon: <FileTextOutlined />, label: '我的作品' },
    { key: '/works/upload', icon: <FormOutlined />, label: '上传作品' },
    { key: '/archives', icon: <FolderOpenOutlined />, label: '我的档案' },
    { key: '/archives/reflection', icon: <FormOutlined />, label: '反思日志' },
    { key: '/dashboard/ai', icon: <RobotOutlined />, label: 'AI 助手' },
    { key: '/feedback', icon: <MessageOutlined />, label: '帮助与反馈' },
  ],
  media: [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '工作台' },
    { key: '/feedback', icon: <MessageOutlined />, label: '帮助与反馈' },
  ],
};

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const items = menuItems[user?.role] || menuItems.student;

  const selectedKey = location.pathname.startsWith('/feedback')
    ? (user?.role === 'admin' ? '/feedback/manage' : '/feedback')
    : '/' + location.pathname.split('/').slice(1, 3).join('/');

  return (
    <Sider width={200} style={{ background: '#001529' }}>
      <div style={{
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 18, fontWeight: 700, borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        🚀 PBL 科创平台
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={items}
        onClick={({ key }) => navigate(key)}
      />
    </Sider>
  );
}
