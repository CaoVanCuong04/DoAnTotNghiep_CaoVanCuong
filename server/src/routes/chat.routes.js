const express = require('express');
const router = express.Router();
const chatController = require('../controller/chat.controller');
const { authUser } = require('../auth/checkAuth');

router.use(authUser);

// Conversations
router.post('/conversations', chatController.createConversation);
router.get('/conversations', chatController.getConversations);

// Messages
router.get('/conversations/:id/messages', chatController.getMessages);
router.post('/conversations/:id/messages', chatController.sendMessage);

module.exports = router;
