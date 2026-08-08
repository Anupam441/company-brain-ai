const express = require('express');
const router = express.Router();
const protect = require('../middlewares/authMiddleware');
const {
  createConversation,
  getConversations,
  sendMessage,
  getMessages,
  deleteConversation
} = require('../controllers/chatController');

router.post('/workspaces/:id/conversations', protect, createConversation);
router.get('/workspaces/:id/conversations', protect, getConversations);
router.post('/conversations/:conversationId/messages', protect, sendMessage);
router.get('/conversations/:conversationId/messages', protect, getMessages);
router.delete('/conversations/:conversationId', protect, deleteConversation);

module.exports = router;
