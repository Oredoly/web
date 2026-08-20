import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card, Descriptions, List, Space, Tag, Typography, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { taskAPI } from '../../api';

const statusText = { pending: '待完成', in_progress: '进行中', submitted: '已提交', completed: '已完结' };

export default function TaskDetail() {
  const { id } = useParams(); const navigate = useNavigate(); const [data, setData] = useState(null);
  useEffect(() => { taskAPI.detail(id).then(setData).catch(() => message.error('加载任务失败')); }, [id]);
  if (!data) return null;
  const { task, works } = data;
  const rejectedWork = works.find((work) => work.review_status === 'rejected');
  const uploadParams = new URLSearchParams({ task_id: String(task.id) });
  if (task.enrollment_id) uploadParams.set('enrollment_id', String(task.enrollment_id));
  if (rejectedWork) uploadParams.set('parent_work_id', String(rejectedWork.id));
  return <div><Space style={{ marginBottom: 16 }}><Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tasks')}>返回任务</Button><Typography.Title level={4} style={{ margin: 0 }}>{task.title}</Typography.Title></Space>
    <Card><Descriptions column={1} bordered><Descriptions.Item label="所属课程">{task.course_title}</Descriptions.Item><Descriptions.Item label="探究阶段">{task.lesson_title}</Descriptions.Item><Descriptions.Item label="任务状态"><Tag>{statusText[task.status]}</Tag></Descriptions.Item><Descriptions.Item label="截止时间">{task.deadline || '未设置'}</Descriptions.Item><Descriptions.Item label="任务目标与指引">{task.description || '暂无说明'}</Descriptions.Item></Descriptions>
      {['pending', 'in_progress'].includes(task.status) && <Button type="primary" style={{ marginTop: 16 }} onClick={() => navigate(`/works/upload?${uploadParams.toString()}`)}>{task.status === 'in_progress' ? '重新提交成果' : '提交成果'}</Button>}
    </Card>
    <Card title="我的提交与反馈" style={{ marginTop: 16 }}><List dataSource={works} locale={{ emptyText: '尚未提交成果' }} renderItem={(work) => <List.Item><List.Item.Meta title={`${work.title} · 第 ${work.version || 1} 版`} description={work.description || '附件成果'} /><Space><Tag color={work.review_status === 'approved' ? 'green' : work.review_status === 'rejected' ? 'red' : 'orange'}>{work.review_status === 'approved' ? '已通过' : work.review_status === 'rejected' ? '需修改' : '待点评'}</Tag>{work.review_comment && <Typography.Text>{work.review_comment}</Typography.Text>}</Space></List.Item>} /></Card>
  </div>;
}
