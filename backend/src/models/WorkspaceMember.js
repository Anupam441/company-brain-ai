const mongoose = require('mongoose');
const workspaceMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member'
  },
  department: {
    type: String,
    enum: ['general', 'hr', 'engineering', 'sales', 'finance'],
    default: 'general'
  }
}, { timestamps: true });
workspaceMemberSchema.index({ user: 1, workspace: 1 }, { unique: true });
module.exports = mongoose.model('WorkspaceMember', workspaceMemberSchema);
