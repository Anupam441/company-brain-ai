const Document = require('../models/Document');
const WorkspaceMember = require('../models/WorkspaceMember');
const processDocument = require('../services/processDocument');
// UPLOAD DOCUMENT
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
    res.status(201).json({
      message: 'File uploaded successfully, processing will begin shortly',
      document
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
};
// GET WORKSPACE DOCUMENTS (filtered by department access)
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
    // Admins see everything. Members only see public docs + docs allowed for their department.
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
    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete documents' });
    }
    await Document.findByIdAndDelete(docId);
    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete document', error: error.message });
  }
};
