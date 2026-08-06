const Workspace = require('../models/Workspace');
const WorkspaceMember = require('../models/WorkspaceMember');
const User = require('../models/User');
// CREATE WORKSPACE
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
      role: 'admin'
    });
    res.status(201).json({ message: 'Workspace created successfully', workspace });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create workspace', error: error.message });
  }
};
// GET MY WORKSPACES
exports.getMyWorkspaces = async (req, res) => {
  try {
    const userId = req.user.id;
    const memberships = await WorkspaceMember.find({ user: userId }).populate('workspace');
    const workspaces = memberships.map((m) => ({
      id: m.workspace._id,
      name: m.workspace.name,
      plan: m.workspace.plan,
      role: m.role
    }));
    res.status(200).json({ workspaces });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch workspaces', error: error.message });
  }
};
// INVITE MEMBER TO WORKSPACE
exports.inviteMember = async (req, res) => {
  try {
    const { id: workspaceId } = req.params;
    const { email, role } = req.body;
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
    const newMembership = await WorkspaceMember.create({
      user: userToInvite._id,
      workspace: workspaceId,
      role: role === 'admin' ? 'admin' : 'member'
    });
    res.status(201).json({
      message: 'Member added successfully',
      member: {
        id: userToInvite._id,
        name: userToInvite.name,
        email: userToInvite.email,
        role: newMembership.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to invite member', error: error.message });
  }
};
// GET WORKSPACE MEMBERS
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
      role: m.role
    }));
    res.status(200).json({ members });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch members', error: error.message });
  }
};
