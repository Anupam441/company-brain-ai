const express = require('express');
const router = express.Router();
const protect = require('../middlewares/authMiddleware');
const {
  createConversation,
  sendMessage,
  getMessages
} = require('../controllers/chatController');
router.post('/workspaces/:id/conversations', protect, createConversation);
router.post('/conversations/:conversationId/messages', protect, sendMessage);
router.get('/conversations/:conversationId/messages', protect, getMessages);
module.exports = router;
