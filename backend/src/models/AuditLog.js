const mongoose = require('mongoose');
const auditLogSchema = new mongoose.Schema({
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  targetType: {
    type: String,
    enum: ['document', 'member', 'workspace'],
    required: true
  },
  targetName: {
    type: String,
    default: ''
  },
  metadata: {
    type: Object,
    default: {}
  }
}, { timestamps: true });
module.exports = mongoose.model('AuditLog', auditLogSchema);
