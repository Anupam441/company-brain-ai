const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: String,
    enum: ['user', 'ai'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  citedDocuments: {
    type: [
      {
        documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
        documentName: String
      }
    ],
    default: []
  },
  feedback: {
    type: String,
    enum: ['up', 'down', null],
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
