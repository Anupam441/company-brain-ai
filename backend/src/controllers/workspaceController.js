const Workspace = require('../models/Workspace');
const WorkspaceMember = require('../models/WorkspaceMember');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');
const logAction = require('../services/auditLog');
exports.createWorkspace = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;
    if (!name) {
      return res.status(400).json({ message: 'Workspace name is required' });
    }
    const workspace = await Workspace.create({ name, owner: userId });
    await WorkspaceMember.create({
      user: userId,
      workspace: workspace._id,
      role: 'admin',
      department: 'general'
    });
    logAction({
      workspaceId: workspace._id, userId, action: 'created workspace',
      targetType: 'workspace', targetName: workspace.name
    });
    res.status(201).json({ message: 'Workspace created successfully', workspace });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create workspace', error: error.message });
  }
};
exports.getMyWorkspaces = async (req, res) => {
  try {
    const userId = req.user.id;
    const memberships = await WorkspaceMember.find({ user: userId }).populate('workspace');
    const workspaces = memberships.map((m) => ({
      id: m.workspace._id,
      name: m.workspace.name,
      plan: m.workspace.plan,
      role: m.role,
      department: m.department
    }));
    res.status(200).json({ workspaces });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch workspaces', error: error.message });
  }
};
exports.inviteMember = async (req, res) => {
  try {
    const { id: workspaceId } = req.params;
    const { email, role, department } = req.body;
    const requesterId = req.user.id;
    const requesterMembership = await WorkspaceMember.findOne({
      user: requesterId,
      workspace: workspaceId
    });
    if (!requesterMembership || requesterMembership.role !== 'admin') {
      return res.status(403).json({ message: 'Only workspace admins can invite members' });
    }
    const userToInvite = await User.findOne({ email });
    if (!userToInvite) {
      return res.status(404).json({ message: 'No user found with this email. They must sign up first.' });
    }
    const existingMembership = await WorkspaceMember.findOne({
      user: userToInvite._id,
      workspace: workspaceId
    });
    if (existingMembership) {
      return res.status(400).json({ message: 'User is already a member of this workspace' });
    }
    const validDepartments = ['general', 'hr', 'engineering', 'sales', 'finance'];
    const newMembership = await WorkspaceMember.create({
      user: userToInvite._id,
      workspace: workspaceId,
      role: role === 'admin' ? 'admin' : 'member',
      department: validDepartments.includes(department) ? department : 'general'
    });
    logAction({
      workspaceId, userId: requesterId, action: 'invited member',
      targetType: 'member', targetName: userToInvite.email
    });
    res.status(201).json({
      message: 'Member added successfully',
      member: {
        id: userToInvite._id,
        name: userToInvite.name,
        email: userToInvite.email,
        role: newMembership.role,
        department: newMembership.department
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to invite member', error: error.message });
  }
};
exports.getMembers = async (req, res) => {
  try {
    const { id: workspaceId } = req.params;
    const requesterId = req.user.id;
    const requesterMembership = await WorkspaceMember.findOne({
      user: requesterId,
      workspace: workspaceId
    });
    if (!requesterMembership) {
      return res.status(403).json({ message: 'You are not a member of this workspace' });
    }
    const memberships = await WorkspaceMember.find({ workspace: workspaceId }).populate('user');
    const members = memberships.map((m) => ({
      id: m.user._id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      department: m.department
    }));
    res.status(200).json({ members });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch members', error: error.message });
  }
};
exports.updateMember = async (req, res) => {
  try {
    const { id: workspaceId, memberId } = req.params;
    const { department, role } = req.body;
    const requesterId = req.user.id;
    const requesterMembership = await WorkspaceMember.findOne({
      user: requesterId,
      workspace: workspaceId
    });
    if (!requesterMembership || requesterMembership.role !== 'admin') {
      return res.status(403).json({ message: 'Only workspace admins can update members' });
    }
    const targetMembership = await WorkspaceMember.findOne({
      user: memberId,
      workspace: workspaceId
    }).populate('user');
    if (!targetMembership) {
      return res.status(404).json({ message: 'Member not found in this workspace' });
    }
    const validDepartments = ['general', 'hr', 'engineering', 'sales', 'finance'];
    const changes = [];
    if (department && validDepartments.includes(department) && department !== targetMembership.department) {
      changes.push(`department → ${department}`);
      targetMembership.department = department;
    }
    if (role && ['admin', 'member'].includes(role) && role !== targetMembership.role) {
      changes.push(`role → ${role}`);
      targetMembership.role = role;
    }
    await targetMembership.save();
    if (changes.length > 0) {
      logAction({
        workspaceId, userId: requesterId, action: `updated member (${changes.join(', ')})`,
        targetType: 'member', targetName: targetMembership.user.email
      });
    }
    res.status(200).json({ message: 'Member updated successfully', member: targetMembership });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update member', error: error.message });
  }
};
exports.getAuditLogs = async (req, res) => {
  try {
    const { id: workspaceId } = req.params;
    const requesterId = req.user.id;
    const requesterMembership = await WorkspaceMember.findOne({
      user: requesterId,
      workspace: workspaceId
    });
    if (!requesterMembership || requesterMembership.role !== 'admin') {
      return res.status(403).json({ message: 'Only workspace admins can view audit logs' });
    }
    const logs = await AuditLog.find({ workspace: workspaceId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.status(200).json({ logs });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch audit logs', error: error.message });
  }
};
// RENAME WORKSPACE (admin only)
exports.renameWorkspace = async (req, res) => {
  try {
    const { id: workspaceId } = req.params;
    const { name } = req.body;
    const requesterId = req.user.id;
    if (!name || name.trim().length < 1) {
      return res.status(400).json({ message: 'Workspace name is required' });
    }
    const requesterMembership = await WorkspaceMember.findOne({
      user: requesterId,
      workspace: workspaceId
    });
    if (!requesterMembership || requesterMembership.role !== 'admin') {
      return res.status(403).json({ message: 'Only workspace admins can rename the workspace' });
    }
    const workspace = await Workspace.findById(workspaceId);
    const oldName = workspace.name;
    workspace.name = name.trim();
    await workspace.save();
    logAction({
      workspaceId, userId: requesterId, action: `renamed workspace (${oldName} → ${workspace.name})`,
      targetType: 'workspace', targetName: workspace.name
    });
    res.status(200).json({ message: 'Workspace renamed', workspace });
  } catch (error) {
    res.status(500).json({ message: 'Failed to rename workspace', error: error.message });
  }
};
// DELETE WORKSPACE (admin only, destructive)
exports.deleteWorkspace = async (req, res) => {
  try {
    const { id: workspaceId } = req.params;
    const requesterId = req.user.id;
    const requesterMembership = await WorkspaceMember.findOne({
      user: requesterId,
      workspace: workspaceId
    });
    if (!requesterMembership || requesterMembership.role !== 'admin') {
      return res.status(403).json({ message: 'Only workspace admins can delete the workspace' });
    }
    const docs = await Document.find({ workspace: workspaceId });
    const docIds = docs.map((d) => d._id);
    await DocumentChunk.deleteMany({ document: { $in: docIds } });
    await Document.deleteMany({ workspace: workspaceId });
    await WorkspaceMember.deleteMany({ workspace: workspaceId });
    await AuditLog.deleteMany({ workspace: workspaceId });
    await Workspace.findByIdAndDelete(workspaceId);
    res.status(200).json({ message: 'Workspace deleted permanently' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete workspace', error: error.message });
  }
};
