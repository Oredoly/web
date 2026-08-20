const express = require('express');
const router = express.Router();
const controller = require('../controllers/taskController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth);
router.use(requireRole('student', 'admin', 'executive_mentor', 'academic_mentor', 'teacher'));
router.get('/', controller.list);
router.get('/:id', controller.detail);

module.exports = router;
