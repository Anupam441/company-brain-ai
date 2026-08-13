const express = require('express');
const router = express.Router();
const protect = require('../middlewares/authMiddleware');
const {
  createWorkspace,
  getMyWorkspaces,
  inviteMember,
  getMembers,
  updateMember,
  getAuditLogs
} = require('../controllers/workspaceController');
router.post('/', protect, createWorkspace);
router.get('/', protect, getMyWorkspaces);
router.post('/:id/invite', protect, inviteMember);
router.get('/:id/members', protect, getMembers);
router.patch('/:id/members/:memberId', protect, updateMember);
router.get('/:id/audit-logs', protect, getAuditLogs);
module.exports = router;
