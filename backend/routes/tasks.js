const express = require('express');
const router = express.Router();
const controller = require('../controllers/taskController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);
router.get('/', controller.list);
router.get('/:id', controller.detail);

module.exports = router;
