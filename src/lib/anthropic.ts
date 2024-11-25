import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function extractClauses(pdfBuffer: Buffer) {
  const message = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Please analyze this contract PDF and extract all clauses, categorizing them by type (e.g. arbitration, confidentiality, etc). For each clause, provide:\n1. The clause type\n2. A brief description\n3. The exact text of the clause'
        },
        {
          type: 'file',
          file_path: {
            file_id: 'temp',
            data: pdfBuffer
          }
        }
      ]
    }],
  }, {
    headers: {
      'anthropic-beta': 'pdfs-2024-09-25'
    }
  });

  return message.content;
}
