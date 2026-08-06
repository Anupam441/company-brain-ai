const mongoose = require('mongoose');
const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    enum: ['free', 'startup', 'business', 'enterprise'],
    default: 'free'
  }
}, { timestamps: true });
module.exports = mongoose.model('Workspace', workspaceSchema);
