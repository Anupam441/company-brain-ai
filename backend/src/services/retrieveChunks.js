const DocumentChunk = require('../models/DocumentChunk');
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
async function retrieveRelevantChunks(workspaceId, question, topK = 5) {
  const questionEmbedding = await generateEmbedding(question);
  const allChunks = await DocumentChunk.find({ workspace: workspaceId }).populate('document');
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
