const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');
const WorkspaceMember = require('../models/WorkspaceMember');
const processDocument = require('../services/processDocument');
const logAction = require('../services/auditLog');
exports.uploadDocument = async (req, res) => {
  try {
    const { id: workspaceId } = req.params;
    const userId = req.user.id;
    const { visibility, allowedDepartments } = req.body;
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
    let deptList = [];
    if (allowedDepartments) {
      deptList = Array.isArray(allowedDepartments) ? allowedDepartments : JSON.parse(allowedDepartments);
    }
    const document = await Document.create({
      workspace: workspaceId,
      uploadedBy: userId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileType: req.file.mimetype,
      filePath: req.file.path,
      status: 'processing',
      visibility: visibility === 'restricted' ? 'restricted' : 'public',
      allowedDepartments: deptList
    });
    processDocument(document._id);
    logAction({
      workspaceId, userId, action: 'uploaded document',
      targetType: 'document', targetName: document.originalName
    });
    res.status(201).json({
      message: 'File uploaded successfully, processing will begin shortly',
      document
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};
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
    let query = { workspace: workspaceId };
    if (membership.role !== 'admin') {
      query = {
        workspace: workspaceId,
        $or: [
          { visibility: 'public' },
          { visibility: 'restricted', allowedDepartments: membership.department }
        ]
      };
    }
    const documents = await Document.find(query).sort({ createdAt: -1 });
    res.status(200).json({ documents });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch documents', error: error.message });
  }
};
exports.getDocumentPreview = async (req, res) => {
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
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (membership.role !== 'admin' && document.visibility === 'restricted') {
      if (!document.allowedDepartments.includes(membership.department)) {
        return res.status(403).json({ message: 'You do not have access to this document' });
      }
    }
    const chunks = await DocumentChunk.find({ document: docId }).sort({ chunkIndex: 1 }).limit(15);
    const contentPreview = chunks.map((c) => c.text).join('\n\n');
    res.status(200).json({
      document: {
        originalName: document.originalName,
        status: document.status,
        visibility: document.visibility,
        allowedDepartments: document.allowedDepartments,
        createdAt: document.createdAt
      },
      contentPreview: contentPreview || null,
      truncated: chunks.length === 15
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch preview', error: error.message });
  }
};
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
    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete documents' });
    }
    const docName = document.originalName;
    const workspaceId = document.workspace;
    await Document.findByIdAndDelete(docId);
    await DocumentChunk.deleteMany({ document: docId });
    logAction({
      workspaceId, userId, action: 'deleted document',
      targetType: 'document', targetName: docName
    });
    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete document', error: error.message });
  }
};
