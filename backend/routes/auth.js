const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.get('/schools', controller.getSchools);
router.get('/classes', controller.getClasses);
router.post('/login', controller.login);
router.post('/register', controller.register);
router.get('/me', requireAuth, controller.me);

module.exports = router;
