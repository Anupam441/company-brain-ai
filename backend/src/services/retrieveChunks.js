const DocumentChunk = require('../models/DocumentChunk');
const Document = require('../models/Document');
const generateEmbedding = require('./generateEmbedding');
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
async function retrieveRelevantChunks(workspaceId, question, membership, topK = 5) {
  const questionEmbedding = await generateEmbedding(question);
  // Figure out which documents this member is allowed to see
  let docQuery = { workspace: workspaceId };
  if (membership.role !== 'admin') {
    docQuery = {
      workspace: workspaceId,
      $or: [
        { visibility: 'public' },
        { visibility: 'restricted', allowedDepartments: membership.department }
      ]
    };
  }
  const allowedDocs = await Document.find(docQuery).select('_id');
  const allowedDocIds = allowedDocs.map((d) => d._id);
  const allChunks = await DocumentChunk.find({
    workspace: workspaceId,
    document: { $in: allowedDocIds }
  }).populate('document');
  const scoredChunks = allChunks.map((chunk) => ({
    chunk,
    score: cosineSimilarity(questionEmbedding, chunk.embedding)
  }));
  scoredChunks.sort((a, b) => b.score - a.score);
  return scoredChunks.slice(0, topK).map((item) => ({
    text: item.chunk.text,
    documentId: item.chunk.document._id,
    documentName: item.chunk.document.originalName,
    score: item.score
  }));
}
module.exports = retrieveRelevantChunks;
