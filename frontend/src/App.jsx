import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider } from './store/AuthContext';
import AppLayout from './components/AppLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ChangePassword from './pages/auth/ChangePassword';
import Dashboard from './pages/dashboard/Index';
import SchoolDetail from './pages/dashboard/School';
import CourseList from './pages/courses/List';
import CourseDetail from './pages/courses/Detail';
import CourseForm from './pages/courses/Form';
import StudentList from './pages/students/List';
import StudentDetail from './pages/students/Detail';
import WorkList from './pages/works/List';
import WorkDetail from './pages/works/Detail';
import WorkUpload from './pages/works/Upload';
import ArchiveIndex from './pages/archives/Index';
import Reflection from './pages/archives/Reflection';
import AIAssistant from './pages/dashboard/AI';

function App() {
  return (
    <ConfigProvider locale={zhCN} theme={{
      token: {
        colorPrimary: '#1a73e8',
        borderRadius: 8,
      }
    }}>
      <AntApp>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<AppLayout />}>
                <Route path="change-password" element={<ChangePassword />} />
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="dashboard/schools/:id" element={<SchoolDetail />} />
                <Route path="dashboard/ai" element={<AIAssistant />} />
                <Route path="courses" element={<CourseList />} />
                <Route path="courses/create" element={<CourseForm />} />
                <Route path="courses/:id" element={<CourseDetail />} />
                <Route path="courses/:id/edit" element={<CourseForm />} />
                <Route path="students" element={<StudentList />} />
                <Route path="students/:id" element={<StudentDetail />} />
                <Route path="works" element={<WorkList />} />
                <Route path="works/upload" element={<WorkUpload />} />
                <Route path="works/:id" element={<WorkDetail />} />
                <Route path="archives" element={<ArchiveIndex />} />
                <Route path="archives/reflection" element={<Reflection />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
