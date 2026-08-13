const express = require('express');
const router = express.Router();
const protect = require('../middlewares/authMiddleware');
const {
  createConversation,
  getMyConversations,
  sendMessage,
  getMessages,
  submitFeedback
} = require('../controllers/chatController');

router.post('/workspaces/:id/conversations', protect, createConversation);
router.get('/workspaces/:id/conversations', protect, getMyConversations);
router.post('/conversations/:conversationId/messages', protect, sendMessage);
router.get('/conversations/:conversationId/messages', protect, getMessages);
router.patch('/messages/:messageId/feedback', protect, submitFeedback);

module.exports = router;
