const mongoose = require('mongoose');
const documentSchema = new mongoose.Schema({
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['processing', 'ready', 'failed'],
    default: 'processing'
  },
  errorMessage: {
    type: String,
    default: null
  },
  visibility: {
    type: String,
    enum: ['public', 'restricted'],
    default: 'public'
  },
  allowedDepartments: {
    type: [String],
    default: []
  }
}, { timestamps: true });
module.exports = mongoose.model('Document', documentSchema);
