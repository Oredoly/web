import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Space, Typography, Spin, Input, message, Form, Select } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons';
import { workAPI } from '../../api';
import { useAuth } from '../../store/AuthContext';

const { Title } = Typography;
const dimensions = [['problem_discovery', '问题发现'], ['solution_design', '方案设计'], ['hands_on', '动手操作'], ['data_analysis', '数据分析'], ['presentation', '表达展示']];

export default function WorkDetail() {
  const { id } = useParams(); const { user } = useAuth(); const navigate = useNavigate();
  const [data, setData] = useState(null); const [loading, setLoading] = useState(true);
  useEffect(() => { workAPI.detail(id).then(setData).catch(() => message.error('加载失败')).finally(() => setLoading(false)); }, [id]);
  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!data?.work) return <p>作品不存在</p>;
  const { work, review, versions = [] } = data;
  const isOwner = work.student_id === user?.id;
  const isStaff = ['admin', 'executive_mentor', 'academic_mentor', 'teacher'].includes(user?.role);
  return <div><Space style={{ marginBottom: 16 }}><Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/works')}>返回</Button><Title level={4} style={{ margin: 0 }}>{work.title}</Title></Space><Card>
    <Descriptions column={2} bordered size="small"><Descriptions.Item label="学生">{work.student_name}</Descriptions.Item><Descriptions.Item label="课程/任务">{work.course_title || '—'} / {work.task_title || '—'}</Descriptions.Item><Descriptions.Item label="状态"><Tag color={work.review_status === 'approved' ? 'green' : work.review_status === 'rejected' ? 'red' : 'orange'}>{work.review_status === 'pending' ? '待批改' : work.review_status === 'approved' ? '通过' : '需修改'}</Tag></Descriptions.Item><Descriptions.Item label="提交时间">{work.created_at}</Descriptions.Item><Descriptions.Item label="版本">第 {work.version || 1} 版</Descriptions.Item><Descriptions.Item label="历史版本"><Select value={Number(id)} onChange={(value) => navigate(`/works/${value}`)} style={{ width: 180 }} options={versions.map((v) => ({ value: v.id, label: `第 ${v.version || 1} 版` }))} /></Descriptions.Item></Descriptions>
    {work.description && <p style={{ marginTop: 12 }}>{work.description}</p>}{work.file_path && <Button type="primary" icon={<DownloadOutlined />} href={`http://localhost:3000/${work.file_path}`} target="_blank">下载附件</Button>}
    {review && <Card title="教师批改" size="small" style={{ marginTop: 16 }}><p>{review.comment || '暂无评语'}</p><p>修改建议：{review.suggestion || '无'}</p><Space wrap>{dimensions.map(([key, label]) => <Tag key={key} color="blue">{label} {review[key]} 分</Tag>)}</Space></Card>}
    {isOwner && work.review_status === 'rejected' && <Button type="primary" style={{ marginTop: 16 }} onClick={() => navigate(`/works/upload?parent_work_id=${work.id}&task_id=${work.task_id || ''}&enrollment_id=${work.enrollment_id || ''}`)}>修改后重新提交</Button>}
    {isStaff && <Card title="作品批改" size="small" style={{ marginTop: 16 }}><Form layout="vertical" initialValues={{ status: 'approved', ...review }} onFinish={async (values) => { await workAPI.review(id, values); message.success('批改已保存'); const next = await workAPI.detail(id); setData(next); }}><Form.Item name="comment" label="教师评语"><Input.TextArea rows={2} /></Form.Item><Form.Item name="suggestion" label="修改建议"><Input.TextArea rows={2} /></Form.Item><Space wrap>{dimensions.map(([key, label]) => <Form.Item key={key} name={key} label={label} rules={[{ required: true, message: '请选择评分' }]}><Select style={{ width: 120 }} options={[1,2,3,4,5].map((v) => ({ value: v, label: `${v} 分` }))} /></Form.Item>)}</Space><Form.Item name="status" label="批改结果"><Select options={[{ value: 'approved', label: '通过' }, { value: 'rejected', label: '需修改' }]} /></Form.Item><Button type="primary" htmlType="submit">保存批改</Button></Form></Card>}
  </Card></div>;
}
