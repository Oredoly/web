const express = require('express');
const router = express.Router();
const controller = require('../controllers/dashboardController');
const aiController = require('../controllers/aiController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/', requireAuth, controller.index);
router.get('/schools/add', requireRole('admin'), controller.showAddSchool);
router.get('/schools/:id', requireRole('admin'), controller.showSchool);
router.post('/schools', requireRole('admin'), controller.addSchool);
router.post('/schools/:id/classes', requireRole('admin'), controller.addClass);
router.post('/schools/:id/classes/:classId/delete', requireRole('admin'), controller.deleteClass);
router.post('/schools/:id/delete', requireRole('admin'), controller.deleteSchool);

// AI 助教
router.get('/ai', requireAuth, aiController.showChat);
router.post('/ai/ask', requireAuth, aiController.ask);

module.exports = router;
