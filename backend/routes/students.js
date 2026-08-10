const express = require('express');
const router = express.Router();
const controller = require('../controllers/studentController');
const { requireAuth, requireRole } = require('../middleware/auth');

// 公开接口（获取班级列表，注册用）
router.get('/classes/:schoolId', controller.getClasses);

router.use(requireAuth);

// 用户列表
router.get('/', requireRole('admin', 'executive_mentor', 'academic_mentor', 'teacher'), controller.list);

// 学生 CRUD
router.post('/', requireRole('admin', 'executive_mentor', 'teacher'), controller.create);
router.get('/:id', controller.detail);
router.put('/:id', requireRole('admin', 'executive_mentor', 'academic_mentor', 'teacher'), controller.updateStudent);
router.delete('/:id', requireRole('admin', 'executive_mentor', 'academic_mentor', 'teacher'), controller.deleteStudent);

// 批量导入
router.post('/import', requireRole('admin', 'executive_mentor'), controller.import);

// 学校和班级管理（管理员）
router.post('/schools', requireRole('admin'), controller.createSchool);
router.delete('/schools/:id', requireRole('admin'), controller.deleteSchool);
router.post('/classes', requireRole('admin'), controller.createClass);
router.delete('/classes/:id', requireRole('admin'), controller.deleteClass);

// 用户管理（管理员）
router.post('/users', requireRole('admin'), controller.createUser);
router.put('/users/:id', requireRole('admin'), controller.updateUser);
router.delete('/users/:id', requireRole('admin'), controller.deleteUser);
router.post('/users/batch-delete', requireRole('admin'), controller.batchDeleteUsers);

module.exports = router;
