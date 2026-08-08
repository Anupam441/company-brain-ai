const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const WorkspaceMember = require('../models/WorkspaceMember');
const retrieveRelevantChunks = require('../services/retrieveChunks');
const generateAnswer = require('../services/generateAnswer');

exports.createConversation = async (req, res) => {
  try {
    const { id: workspaceId } = req.params;
    const userId = req.user.id;

    const membership = await WorkspaceMember.findOne({ user: userId, workspace: workspaceId });
    if (!membership) {
      return res.status(403).json({ message: 'You are not a member of this workspace' });
    }

    const conversation = await Conversation.create({
      workspace: workspaceId,
      user: userId
    });

    res.status(201).json({ message: 'Conversation created', conversation });

  } catch (error) {
    res.status(500).json({ message: 'Failed to create conversation', error: error.message });
  }
};

// GET ALL MY CONVERSATIONS IN A WORKSPACE
exports.getConversations = async (req, res) => {
  try {
    const { id: workspaceId } = req.params;
    const userId = req.user.id;

    const membership = await WorkspaceMember.findOne({ user: userId, workspace: workspaceId });
    if (!membership) {
      return res.status(403).json({ message: 'You are not a member of this workspace' });
    }

    const conversations = await Conversation.find({ workspace: workspaceId, user: userId })
      .sort({ updatedAt: -1 });

    res.status(200).json({ conversations });

  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch conversations', error: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { question } = req.body;
    const userId = req.user.id;

    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const membership = await WorkspaceMember.findOne({
      user: userId,
      workspace: conversation.workspace
    });
    if (!membership) {
      return res.status(403).json({ message: 'You are not authorized for this conversation' });
    }

    await Message.create({
      conversation: conversationId,
      sender: 'user',
      content: question
    });

    // Auto-title the conversation from the first message
    if (conversation.title === 'New Conversation') {
      conversation.title = question.length > 50 ? question.slice(0, 50) + '...' : question;
    }
    conversation.updatedAt = new Date();
    await conversation.save();

    const relevantChunks = await retrieveRelevantChunks(conversation.workspace, question, membership);

    let aiAnswer;
    let citedDocuments = [];

    if (relevantChunks.length === 0) {
      aiAnswer = "I don't have any documents to search yet, or you don't have access to relevant documents. Please upload some documents first.";
    } else {
      aiAnswer = await generateAnswer(question, relevantChunks);

      const seen = new Set();
      citedDocuments = relevantChunks
        .filter((c) => {
          if (seen.has(c.documentId.toString())) return false;
          seen.add(c.documentId.toString());
          return true;
        })
        .map((c) => ({ documentId: c.documentId, documentName: c.documentName }));
    }

    const aiMessage = await Message.create({
      conversation: conversationId,
      sender: 'ai',
      content: aiAnswer,
      citedDocuments
    });

    res.status(200).json({
      answer: aiAnswer,
      citedDocuments,
      messageId: aiMessage._id
    });

  } catch (error) {
    res.status(500).json({ message: 'Failed to process message', error: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const membership = await WorkspaceMember.findOne({
      user: userId,
      workspace: conversation.workspace
    });
    if (!membership) {
      return res.status(403).json({ message: 'You are not authorized for this conversation' });
    }

    const messages = await Message.find({ conversation: conversationId }).sort({ createdAt: 1 });

    res.status(200).json({ messages });

  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
  }
};

// DELETE A CONVERSATION
exports.deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    if (conversation.user.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Message.deleteMany({ conversation: conversationId });
    await Conversation.findByIdAndDelete(conversationId);

    res.status(200).json({ message: 'Conversation deleted' });

  } catch (error) {
    res.status(500).json({ message: 'Failed to delete conversation', error: error.message });
  }
};
