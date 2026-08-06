const express = require('express');
const router = express.Router();
const controller = require('../controllers/archiveController');
const { requireAuth, requireReflectionSubmittable, requireRole } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', controller.showExport);
router.get('/generate-batch', controller.generateBatch);
router.get('/generate', controller.generate);
router.get('/reflection', requireReflectionSubmittable, controller.showReflection);
router.post('/reflection', requireReflectionSubmittable, controller.submitReflection);
router.post('/evaluation', requireRole('admin', 'executive_mentor', 'academic_mentor', 'teacher'), controller.submitEvaluation);

module.exports = router;
