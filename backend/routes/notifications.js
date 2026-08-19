const express = require('express');
const controller = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', controller.list);
router.get('/recent', controller.recent);
router.get('/unread-count', controller.unreadCount);
router.post('/read-all', controller.markAllRead);
router.post('/hide-read', controller.hideRead);
router.get('/:id', controller.detail);
router.patch('/:id/read', controller.markRead);
router.patch('/:id/unread', controller.markUnread);
router.patch('/:id/hide', controller.hide);

module.exports = router;
