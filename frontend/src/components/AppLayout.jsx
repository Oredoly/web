import { Outlet, Navigate } from 'react-router-dom';
import { Layout, Spin } from 'antd';
import { useAuth } from '../store/AuthContext';
import Sidebar from './Sidebar';
import HeaderBar from './Header';

const { Content } = Layout;

export default function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout>
        <HeaderBar />
        <Content style={{ margin: 16, padding: 24, background: '#f5f7fa', borderRadius: 8, minHeight: 360 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
