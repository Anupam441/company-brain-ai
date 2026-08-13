const Document = require('../models/Document');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const WorkspaceMember = require('../models/WorkspaceMember');

exports.getAnalytics = async (req, res) => {
  try {
    const { id: workspaceId } = req.params;
    const userId = req.user.id;

    const membership = await WorkspaceMember.findOne({ user: userId, workspace: workspaceId });
    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can view analytics' });
    }

    // Document stats
    const totalDocuments = await Document.countDocuments({ workspace: workspaceId });
    const readyDocuments = await Document.countDocuments({ workspace: workspaceId, status: 'ready' });
    const failedDocuments = await Document.countDocuments({ workspace: workspaceId, status: 'failed' });

    // Conversation & message stats
    const workspaceConversations = await Conversation.find({ workspace: workspaceId }).select('_id');
    const conversationIds = workspaceConversations.map((c) => c._id);
    const totalConversations = conversationIds.length;

    const totalMessages = await Message.countDocuments({ conversation: { $in: conversationIds }, sender: 'user' });

    // Top / recent questions (most recent 8 user questions across the workspace)
    const recentQuestions = await Message.find({ conversation: { $in: conversationIds }, sender: 'user' })
      .sort({ createdAt: -1 })
      .limit(8)
      .select('content createdAt');

    // Messages per day for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentMessages = await Message.find({
      conversation: { $in: conversationIds },
      sender: 'user',
      createdAt: { $gte: sevenDaysAgo }
    }).select('createdAt');

    const dayLabels = [];
    const dayCounts = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dayLabels.push(key);
      dayCounts[key] = 0;
    }
    recentMessages.forEach((m) => {
      const key = m.createdAt.toISOString().slice(0, 10);
      if (dayCounts[key] !== undefined) dayCounts[key]++;
    });
    const messagesPerDay = dayLabels.map((day) => ({ day, count: dayCounts[day] }));

    // Department breakdown
    const members = await WorkspaceMember.find({ workspace: workspaceId });
    const departmentBreakdown = {};
    members.forEach((m) => {
      departmentBreakdown[m.department] = (departmentBreakdown[m.department] || 0) + 1;
    });

    res.status(200).json({
      documents: { total: totalDocuments, ready: readyDocuments, failed: failedDocuments },
      conversations: { total: totalConversations, totalQuestions: totalMessages },
      recentQuestions,
      messagesPerDay,
      departmentBreakdown,
      teamSize: members.length
    });

  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
  }
};
