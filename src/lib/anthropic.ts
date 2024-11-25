import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function extractClauses(pdfBuffer: Buffer) {
  console.log('Preparing Anthropic API request');
  const message = await anthropic.beta.messages.create({
    model: 'claude-3-5-sonnet-20241022',
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

  console.log('Received response from Anthropic API');
  // Convert the content array to a string if needed
  const content = Array.isArray(message.content) 
    ? message.content.map(item => item.text).join('\n')
    : message.content[0]?.text || '';
  return content;
}
