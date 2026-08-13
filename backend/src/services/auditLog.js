const AuditLog = require('../models/AuditLog');
async function logAction({ workspaceId, userId, action, targetType, targetName, metadata = {} }) {
  try {
    await AuditLog.create({
      workspace: workspaceId,
      user: userId,
      action,
      targetType,
      targetName,
      metadata
    });
  } catch (error) {
    console.error('Failed to write audit log:', error.message);
  }
}
module.exports = logAction;
