const Document = require('../models/Document');
const DocumentChunk = require('../models/DocumentChunk');
const extractText = require('./extractText');
const chunkText = require('./chunkText');
const generateEmbedding = require('./generateEmbedding');
async function processDocument(documentId) {
  const document = await Document.findById(documentId);
  if (!document) {
    console.error('Document not found:', documentId);
    return;
  }
  try {
    const rawText = await extractText(document.filePath, document.fileType);
    if (!rawText || rawText.trim().length === 0) {
      throw new Error('No text could be extracted from this file');
    }
    const chunks = chunkText(rawText);
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i]);
      await DocumentChunk.create({
        document: document._id,
        workspace: document.workspace,
        chunkIndex: i,
        text: chunks[i],
        embedding: embedding
      });
    }
    document.status = 'ready';
    document.errorMessage = null;
    await document.save();
  } catch (error) {
    document.status = 'failed';
    document.errorMessage = error.message;
    await document.save();
  }
}
module.exports = processDocument;
