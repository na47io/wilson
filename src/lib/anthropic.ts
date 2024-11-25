import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function extractClauses(text: string) {
  const message = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `Please analyze this contract text and extract all clauses, categorizing them by type (e.g. arbitration, confidentiality, etc). For each clause, provide:
      1. The clause type
      2. A brief description
      3. The exact text of the clause
      
      Contract text:
      ${text}`
    }],
  });

  return message.content;
}
