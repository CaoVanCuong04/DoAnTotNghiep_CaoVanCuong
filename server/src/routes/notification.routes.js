const express = require('express');
const router = express.Router();
const notificationController = require('../controller/notification.controller');
const { authUser } = require('../auth/checkAuth');

router.use(authUser);

router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;
