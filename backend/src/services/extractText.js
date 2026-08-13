const fs = require('fs');
const mammoth = require('mammoth');

async function extractText(filePath, fileType) {
  if (fileType === 'application/pdf') {
    const pdfParseModule = await import('pdf-parse');
    const pdfParse = pdfParseModule.default || pdfParseModule;
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  }

  if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  if (fileType === 'text/plain') {
    return fs.readFileSync(filePath, 'utf8');
  }

  throw new Error('Unsupported file type for text extraction');
}

module.exports = extractText;
