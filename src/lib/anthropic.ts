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
          text: 'Analyze this contract PDF and extract the following critical clauses:\n\n1. Indemnification clauses\n2. Termination clauses\n3. Liability clauses\n\nFor each clause found, provide the information in this exact JSON format:\n\n{\n  "clauses": [\n    {\n      "type": "<clause type>",\n      "summary": "<2-3 sentence summary>",\n      "text": "<exact quote from document>",\n      "citation": "<page number and location>"\n    }\n  ],\n  "missing_types": ["<list of clause types not found>"]\n}\n\nRules:\n- Include page numbers and locations for every clause\n- Quote the exact text from the document\n- Use consistent clause type names\n- If a clause type is not found, include it in missing_types\n- Ensure valid JSON format'
        }
      ]
    }]
  });

  console.log('Received response from Anthropic API');
  console.log(message.content)
  const content = Array.isArray(message.content)
    ? message.content.map(item => item.text).join('\n')
    : message.content[0]?.text || '';

  try {
    // Parse the JSON response
    const parsedContent = JSON.parse(content);
    return parsedContent;
  } catch (error) {
    console.error('Failed to parse Anthropic response as JSON:', error);
    throw new Error('Invalid response format from AI');
  }
}
