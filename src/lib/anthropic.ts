import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function extractClauses(pdfBuffer: Buffer) {
  const message = await anthropic.beta.messages.create({
    model: 'claude-3-sonnet-20241022',
    betas: ["pdfs-2024-09-25"],
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: pdfBuffer.toString('base64')
          }
        },
        {
          type: 'text',
          text: 'Analyze this contract PDF and extract the following critical clauses:\n\n1. Indemnification clauses\n2. Termination clauses\n3. Liability clauses\n\nFor each clause found, provide:\n- Clause Type (one of the above)\n- Brief summary of the clause\'s key points (2-3 sentences)\n- The complete verbatim text of the clause\n\nIf any of these clause types are not found in the document, explicitly state that they are missing. Format the response in a clear, structured way with clear separation between different clauses.'
        }
      ]
    }]
  });

  return message.content;
}
