import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Card, Button, Space, Input, Typography, Tag, Modal, Form, Select, message, Tabs } from 'antd';
import { PlusOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { studentAPI } from '../../api';
import { useAuth } from '../../store/AuthContext';

const { Title } = Typography;

const canManage = (role) => ['admin', 'executive_mentor', 'academic_mentor', 'teacher'].includes(role);

export default function StudentList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [addModal, setAddModal] = useState(false);
  const [schools, setSchools] = useState([]);
  const [classes, setClasses] = useState([]);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await studentAPI.list({ search });
      if (user?.role === 'admin') {
        setData(res.tree || { schools: [], unassigned: { teacher: [], student: [] } });
      } else {
        setData(res.students || []);
      }
    } catch { /* handled */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [search]);

  const handleAdd = async (values) => {
    try {
      await studentAPI.create(values);
      message.success('添加成功');
      setAddModal(false);
      form.resetFields();
      loadData();
    } catch { /* handled */ }
  };

  const handleDelete = async (id) => {
    try {
      await studentAPI.delete(id);
      message.success('已删除');
      loadData();
    } catch { /* handled */ }
  };

  const handleSchoolChange = async (schoolId) => {
    if (schoolId) {
      const res = await studentAPI.getClasses(schoolId);
      setClasses(res.classes || []);
    }
  };

  useEffect(() => {
    // Load schools for admin
    if (user?.role === 'admin') {
      import('../../api').then(({ dashboardAPI }) => {
        dashboardAPI.getSchools().then((res) => setSchools(res.schools || [])).catch(() => {});
      });
    }
  }, []);

  // Admin tree view
  if (user?.role === 'admin') {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>👥 用户管理</Title>
          <Space>
            <Button icon={<PlusOutlined />} onClick={() => setAddModal(true)}>添加用户</Button>
            <Button icon={<UploadOutlined />} onClick={() => navigate('/students/import')}>批量导入</Button>
          </Space>
        </div>
        <Input.Search placeholder="搜索用户" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 300, marginBottom: 16 }} />
        <Tabs items={[
          {
            key: 'tree', label: '组织结构',
            children: data.schools ? data.schools.map((school) => (
              <Card key={school.id} title={`🏫 ${school.name}`} style={{ marginBottom: 12 }} size="small">
                {school.classes?.map((cls) => (
                  <div key={cls.id} style={{ marginBottom: 8 }}>
                    <strong>📚 {cls.grade ? `${cls.grade} - ` : ''}{cls.name}</strong>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                      {cls.roles?.student?.map((s) => (
                        <Tag key={s.id} color="blue" style={{ cursor: 'pointer' }} onClick={() => navigate(`/students/${s.id}`)}>
                          {s.real_name}
                        </Tag>
                      ))}
                      {cls.roles?.teacher?.map((t) => (
                        <Tag key={t.id} color="green" style={{ cursor: 'pointer' }} onClick={() => navigate(`/students/${t.id}`)}>
                          👨‍🏫 {t.real_name}
                        </Tag>
                      ))}
                    </div>
                  </div>
                ))}
                {data.executiveMentors?.map((m) => (
                  <Tag key={m.id} color="purple" style={{ cursor: 'pointer' }} onClick={() => navigate(`/students/${m.id}`)}>
                    ⭐ {m.real_name} (执行导师)
                  </Tag>
                ))}
              </Card>
            )) : null,
          },
        ]} />

        <Modal title="添加用户" open={addModal} onCancel={() => setAddModal(false)} onOk={() => form.submit()} width={500}>
          <Form form={form} layout="vertical" onFinish={handleAdd}>
            <Form.Item name="real_name" label="真实姓名" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="role" label="身份" rules={[{ required: true }]}>
              <Select options={[
                { label: '学生', value: 'student' }, { label: '教师', value: 'teacher' },
                { label: '执行导师', value: 'executive_mentor' },
              ]} />
            </Form.Item>
            <Form.Item name="password" label="密码"><Input.Password placeholder="默认 pbl123456" /></Form.Item>
            <Form.Item name="school_id" label="学校"><Select onChange={handleSchoolChange} options={schools.map((s) => ({ label: s.name, value: s.id }))} /></Form.Item>
            <Form.Item name="class_id" label="班级"><Select options={classes.map((c) => ({ label: `${c.grade || ''} ${c.name}`, value: c.id }))} /></Form.Item>
            <Form.Item name="email" label="邮箱"><Input /></Form.Item>
            <Form.Item name="phone" label="手机号"><Input /></Form.Item>
          </Form>
        </Modal>
      </div>
    );
  }

  // Non-admin: table view
  const columns = [
    { title: '姓名', dataIndex: 'real_name', render: (text, r) => <a onClick={() => navigate(`/students/${r.id}`)}>{text}</a> },
    { title: '学校', dataIndex: 'school_name' },
    { title: '班级', dataIndex: 'class_name' },
    { title: '状态', dataIndex: 'is_active', render: (v) => <Tag color={v ? 'green' : 'red'}>{v ? '正常' : '禁用'}</Tag> },
    ...(canManage(user?.role) ? [{
      title: '操作', render: (_, r) => <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.id)}>删除</Button>
    }] : []),
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>👥 学生管理</Title>
        {canManage(user?.role) && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModal(true)}>添加学生</Button>
        )}
      </div>
      <Card>
        <Input.Search placeholder="搜索学生" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 300, marginBottom: 16 }} />
        <Table dataSource={Array.isArray(data) ? data : []} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal title="添加学生" open={addModal} onCancel={() => setAddModal(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item name="real_name" label="真实姓名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="password" label="密码"><Input.Password placeholder="默认 pbl123456" /></Form.Item>
          <Form.Item name="school_id" label="学校" rules={[{ required: true }]}>
            <Select onChange={handleSchoolChange} options={schools.map((s) => ({ label: s.name, value: s.id }))} />
          </Form.Item>
          <Form.Item name="class_id" label="班级" rules={[{ required: true }]}>
            <Select options={classes.map((c) => ({ label: `${c.grade || ''} ${c.name}`, value: c.id }))} />
          </Form.Item>
          <Form.Item name="email" label="邮箱"><Input /></Form.Item>
          <Form.Item name="phone" label="手机号"><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
