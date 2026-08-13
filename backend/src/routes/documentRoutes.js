const express = require('express');
const router = express.Router();
const protect = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const {
  uploadDocument,
  getDocuments,
  getDocumentPreview,
  deleteDocument
} = require('../controllers/documentController');
router.post('/:id/upload', protect, upload.single('file'), uploadDocument);
router.get('/:id', protect, getDocuments);
router.get('/preview/:docId', protect, getDocumentPreview);
router.delete('/:docId', protect, deleteDocument);
module.exports = router;
