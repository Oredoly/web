import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Empty, Progress, Select, Space, Tag, Typography } from 'antd';
import { taskAPI } from '../../api';

const labels = { pending: ['待完成', 'orange'], in_progress: ['进行中', 'blue'], submitted: ['已提交', 'gold'], completed: ['已完结', 'green'] };

export default function TaskList() {
  const [tasks, setTasks] = useState([]); const [status, setStatus] = useState(); const navigate = useNavigate();
  useEffect(() => { taskAPI.list(status ? { status } : {}).then((res) => setTasks(res.tasks || [])); }, [status]);
  const groups = tasks.reduce((all, task) => { (all[task.course_title] ||= []).push(task); return all; }, {});
  return <div><Space style={{ marginBottom: 16 }}><Typography.Title level={4} style={{ margin: 0 }}>任务总览</Typography.Title><Select allowClear placeholder="按状态筛选" value={status} onChange={setStatus} options={Object.entries(labels).map(([value, [label]]) => ({ value, label }))} /></Space>
    {Object.keys(groups).length === 0 ? <Card><Empty description="暂无任务" /></Card> : Object.entries(groups).map(([course, items]) => <Card key={course} title={course} style={{ marginBottom: 16 }}>{items.map((task) => <Card.Grid key={task.id} hoverable onClick={() => navigate(`/tasks/${task.id}`)} style={{ width: '100%' }}><Space direction="vertical" style={{ width: '100%' }}><Space><Typography.Text strong>{task.title}</Typography.Text><Tag color={labels[task.status]?.[1]}>{labels[task.status]?.[0]}</Tag></Space><Typography.Text type="secondary">阶段：{task.lesson_title} · 截止：{task.deadline || '未设置'}</Typography.Text><Progress percent={task.status === 'completed' ? 100 : task.status === 'submitted' ? 70 : task.status === 'in_progress' ? 30 : 0} size="small" showInfo={false} /></Space></Card.Grid>)}</Card>)}
  </div>;
}
