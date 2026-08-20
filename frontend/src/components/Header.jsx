import { Layout, Dropdown, Space, Avatar, Tag } from 'antd';
import { UserOutlined, LogoutOutlined, KeyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

const { Header } = Layout;

const roleMap = {
  admin: { label: '管理员', color: 'red' },
  executive_mentor: { label: '执行导师', color: 'blue' },
  academic_mentor: { label: '学术导师', color: 'purple' },
  teacher: { label: '教师', color: 'green' },
  student: { label: '学生', color: 'cyan' },
  media: { label: '新媒体', color: 'orange' },
};

export default function HeaderBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleInfo = roleMap[user?.role] || { label: user?.role, color: 'default' };

  return (
    <Header style={{
      background: '#fff', padding: '0 24px', display: 'flex',
      alignItems: 'center', justifyContent: 'flex-end',
      borderBottom: '1px solid #f0f0f0', height: 56
    }}>
      <Dropdown menu={{
        items: [
          { key: 'change-password', icon: <KeyOutlined />, label: '修改密码', onClick: () => navigate('/change-password') },
          { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout }
        ]
      }}>
        <Space style={{ cursor: 'pointer' }}>
          <Avatar size="small" icon={<UserOutlined />} />
          <span style={{ fontWeight: 500 }}>{user?.real_name}</span>
          <Tag color={roleInfo.color}>{roleInfo.label}</Tag>
        </Space>
      </Dropdown>
    </Header>
  );
}
