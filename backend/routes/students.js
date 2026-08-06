const express = require('express');
const router = express.Router();
const controller = require('../controllers/studentController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/classes/:schoolId', controller.getClasses);
router.use(requireAuth);

router.get('/', requireRole('admin', 'executive_mentor', 'academic_mentor', 'teacher'), controller.list);
router.get('/create', requireRole('admin', 'executive_mentor', 'teacher'), controller.showCreate);
router.post('/create', requireRole('admin', 'executive_mentor', 'teacher'), controller.create);
router.get('/import', requireRole('admin', 'executive_mentor'), controller.showImport);
router.post('/import', requireRole('admin', 'executive_mentor'), controller.import);
router.post('/schools', requireRole('admin'), controller.createSchool);
router.post('/schools/:id/delete', requireRole('admin'), controller.deleteSchool);
router.post('/classes', requireRole('admin'), controller.createClass);
router.post('/classes/:id/delete', requireRole('admin'), controller.deleteClass);
router.post('/users', requireRole('admin'), controller.createUser);
router.get('/users/:id/edit', requireRole('admin'), controller.getUserForEdit);
router.post('/users/:id/edit', requireRole('admin'), controller.updateUser);
router.post('/users/batch-delete', requireRole('admin'), controller.batchDeleteUsers);
router.post('/users/:id/delete', requireRole('admin'), controller.deleteUser);
router.get('/:id/edit', requireRole('admin', 'executive_mentor', 'academic_mentor', 'teacher'), controller.showEditStudent);
router.post('/:id/edit', requireRole('admin', 'executive_mentor', 'academic_mentor', 'teacher'), controller.updateStudent);
router.post('/:id/delete', requireRole('admin', 'executive_mentor', 'academic_mentor', 'teacher'), controller.deleteStudent);
router.get('/:id', controller.detail);

module.exports = router;
