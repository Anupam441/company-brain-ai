const OpenAI = require('openai');
const groqClient = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1'
});
async function generateAnswer(question, relevantChunks) {
  const contextText = relevantChunks
    .map((c, i) => `[Source ${i + 1}: ${c.documentName}]\n${c.text}`)
    .join('\n\n');
  const systemPrompt = `You are Company Brain AI, an internal knowledge assistant.
Answer the user's question using ONLY the context provided below.
If the answer is not in the context, say "I don't have information on that in the uploaded documents."
Always be concise and clear. Mention which source(s) you used.
Context:
${contextText}`;
  const response = await groqClient.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question }
    ],
    temperature: 0.3
  });
  return response.choices[0].message.content;
}
module.exports = generateAnswer;
