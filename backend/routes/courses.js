const express = require('express');
const router = express.Router();
const controller = require('../controllers/courseController');
const { requireAuth, requireRole } = require('../middleware/auth');
const { uploadResource } = require('../middleware/upload');

// 所有课程页面需要登录
router.use(requireAuth);

// 学生自主选课（限3门）
router.post('/enroll', requireRole('student'), controller.studentEnroll);

router.get('/', controller.list);
router.get('/create', requireRole('admin', 'executive_mentor', 'academic_mentor'), controller.showCreate);
router.post('/create', requireRole('admin', 'executive_mentor', 'academic_mentor'), controller.create);
router.get('/:id', controller.detail);
router.get('/:id/edit', requireRole('admin', 'executive_mentor', 'academic_mentor'), controller.showEdit);
router.post('/:id/edit', requireRole('admin', 'executive_mentor', 'academic_mentor'), controller.update);
router.post('/:id/delete', requireRole('admin', 'executive_mentor'), controller.delete);
router.post('/:id/lesson', requireRole('admin', 'executive_mentor', 'academic_mentor'), controller.addLesson);
router.post('/:id/resource', requireRole('admin', 'executive_mentor', 'academic_mentor'), uploadResource.single('file'), controller.uploadResource);
router.post('/lesson/:lesson_id/task', requireRole('admin', 'executive_mentor', 'academic_mentor'), controller.addTask);
router.post('/:id/enroll', requireRole('admin', 'executive_mentor', 'academic_mentor'), controller.enroll);

module.exports = router;
