const Document = require('../models/Document');
const WorkspaceMember = require('../models/WorkspaceMember');
const processDocument = require('../services/processDocument');
// UPLOAD DOCUMENT
exports.uploadDocument = async (req, res) => {
  try {
    const { id: workspaceId } = req.params;
    const userId = req.user.id;
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const membership = await WorkspaceMember.findOne({
      user: userId,
      workspace: workspaceId
    });
    if (!membership) {
      return res.status(403).json({ message: 'You are not a member of this workspace' });
    }
    const document = await Document.create({
      workspace: workspaceId,
      uploadedBy: userId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileType: req.file.mimetype,
      filePath: req.file.path,
      status: 'processing'
    });
    // Trigger background processing (don't wait for it to finish)
    processDocument(document._id);
    res.status(201).json({
      message: 'File uploaded successfully, processing will begin shortly',
      document
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};
// GET WORKSPACE DOCUMENTS
exports.getDocuments = async (req, res) => {
  try {
    const { id: workspaceId } = req.params;
    const userId = req.user.id;
    const membership = await WorkspaceMember.findOne({
      user: userId,
      workspace: workspaceId
    });
    if (!membership) {
      return res.status(403).json({ message: 'You are not a member of this workspace' });
    }
    const documents = await Document.find({ workspace: workspaceId }).sort({ createdAt: -1 });
    res.status(200).json({ documents });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch documents', error: error.message });
  }
};
// DELETE DOCUMENT
exports.deleteDocument = async (req, res) => {
  try {
    const { docId } = req.params;
    const userId = req.user.id;
    const document = await Document.findById(docId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    const membership = await WorkspaceMember.findOne({
      user: userId,
      workspace: document.workspace
    });
    if (!membership) {
      return res.status(403).json({ message: 'You are not authorized to delete this document' });
    }
    await Document.findByIdAndDelete(docId);
    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete document', error: error.message });
  }
};
