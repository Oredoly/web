import { useState, useEffect } from 'react';
import { Card, Tree, Button, Typography, Spin, Descriptions, Tag, List, Space } from 'antd';
import { FolderOpenOutlined, UserOutlined, FileTextOutlined } from '@ant-design/icons';
import { archiveAPI } from '../../api';
import { useAuth } from '../../store/AuthContext';

const { Title, Text } = Typography;

export default function ArchiveIndex() {
  const { user } = useAuth();
  const [treeData, setTreeData] = useState([]);
  const [archive, setArchive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    archiveAPI.getTree().then((res) => {
      const tree = res.tree || res;
      if (tree.schools) {
        setTreeData(tree.schools.map((school) => ({
          title: `🏫 ${school.name}`,
          key: `school-${school.id}`,
          children: (school.classes || []).map((cls) => ({
            title: `📚 ${cls.grade ? `${cls.grade} - ` : ''}${cls.name}`,
            key: `class-${cls.id}`,
            children: [
              ...(cls.roles?.teacher || []).map((t) => ({
                title: `👨‍🏫 ${t.real_name}`,
                key: `user-${t.id}`, icon: <UserOutlined />, isLeaf: true,
              })),
              ...(cls.roles?.student || []).map((s) => ({
                title: s.real_name,
                key: `user-${s.id}`, icon: <UserOutlined />, isLeaf: true,
              })),
            ],
          })),
        })));
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSelect = async (keys) => {
    if (!keys.length) return;
    const key = keys[0];
    if (!key.startsWith('user-')) return;
    const studentId = key.replace('user-', '');
    setDetailLoading(true);
    try {
      const res = await archiveAPI.generate(studentId);
      setArchive(res);
    } catch { /* handled */ }
    finally { setDetailLoading(false); }
  };

  // Student view: show own archive
  if (user?.role === 'student') {
    return (
      <div>
        <Title level={4}>📂 我的成长档案</Title>
        {detailLoading ? <Spin /> : archive ? (
          <ArchiveDetail archive={archive} />
        ) : (
          <Card>
            <Button type="primary" onClick={async () => {
              setDetailLoading(true);
              try { const res = await archiveAPI.generate(user.id); setArchive(res); } catch { /* handled */ }
              finally { setDetailLoading(false); }
            }}>查看我的档案</Button>
          </Card>
        )}
      </div>
    );
  }

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <Title level={4}>📂 成长档案</Title>
      <div style={{ display: 'flex', gap: 16 }}>
        <Card title="学生列表" style={{ width: 320, maxHeight: '70vh', overflow: 'auto' }}>
          <Tree treeData={treeData} onSelect={handleSelect} showIcon defaultExpandAll={false} />
        </Card>
        <Card title="档案详情" style={{ flex: 1 }}>
          {detailLoading ? <Spin /> : archive ? <ArchiveDetail archive={archive} /> : <Text type="secondary">请从左侧选择学生查看档案</Text>}
        </Card>
      </div>
    </div>
  );
}

function ArchiveDetail({ archive }) {
  if (!archive) return null;
  return (
    <div>
      <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
        <Descriptions.Item label="姓名">{archive.student?.real_name}</Descriptions.Item>
        <Descriptions.Item label="学校">{archive.student?.school_name}</Descriptions.Item>
        <Descriptions.Item label="班级">{archive.student?.class_name}</Descriptions.Item>
        <Descriptions.Item label="生成时间">{archive.generatedAt}</Descriptions.Item>
      </Descriptions>

      <Title level={5}>参与课程</Title>
      <List dataSource={archive.courses || []} renderItem={(c) => (
        <List.Item><Tag>{c.difficulty}</Tag> {c.title}</List.Item>
      )} />

      <Title level={5}>提交作品</Title>
      <List dataSource={archive.works || []} renderItem={(w) => (
        <List.Item><FileTextOutlined style={{ marginRight: 8 }} />{w.title}</List.Item>
      )} />

      <Title level={5}>反思日志</Title>
      <List dataSource={archive.reflections || []} renderItem={(r) => (
        <List.Item>
          <List.Item.Meta title={r.lesson_title || '—'} description={r.content?.slice(0, 100)} />
        </List.Item>
      )} />

      {archive.evaluations?.length > 0 && (
        <>
          <Title level={5}>教师评价</Title>
          <List dataSource={archive.evaluations} renderItem={(ev) => (
            <List.Item>
              <List.Item.Meta title={`${ev.evaluator_name} 的评价`} description={ev.content} />
            </List.Item>
          )} />
        </>
      )}
    </div>
  );
}
