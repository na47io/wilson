import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Define the expected response schema
const ClauseSchema = z.object({
  type: z.string(),
  summary: z.string(),
  text: z.string(),
  citation: z.string(),
});

const ResponseSchema = z.object({
  clauses: z.array(ClauseSchema),
  missing_types: z.array(z.string()),
});

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function extractClauses(pdfBuffer: Buffer) {
  let attempts = 0;
  
  while (attempts < MAX_RETRIES) {
    try {
      console.log(`Attempt ${attempts + 1} of ${MAX_RETRIES}`);
      const message = await anthropic.beta.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        betas: ["pdfs-2024-09-25"],
        max_tokens: 4096,
        system: "You are a contract analysis expert. Always respond with valid JSON matching the specified schema. Be thorough and precise.",
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
              text: `Analyze this contract PDF and extract the following critical clauses:

1. Indemnification clauses
2. Termination clauses
3. Liability clauses

Respond ONLY with JSON in this exact format, no other text:

{
  "clauses": [
    {
      "type": "string (one of: Indemnification, Termination, or Liability)",
      "summary": "string (2-3 sentence summary)",
      "text": "string (exact quote from document)",
      "citation": "string (page number and location)"
    }
  ],
  "missing_types": ["string (list of clause types not found)"]
}

Rules:
- Include page numbers and locations for every clause
- Quote the exact text from the document
- Use consistent clause type names (Indemnification, Termination, Liability)
- If a clause type is not found, include it in missing_types
- Response must be valid JSON`
            }
          ]
        }]
      });

      console.log('Received response from Anthropic API');
      
      const content = Array.isArray(message.content)
        ? message.content.map(item => item.text).join('\n')
        : message.content[0]?.text || '';

      // Try to parse and validate the JSON response
      const parsedContent = JSON.parse(content);
      const validatedContent = ResponseSchema.parse(parsedContent);
      
      console.log('Successfully validated response format');
      return validatedContent;
      
    } catch (error) {
      attempts++;
      console.error(`Attempt ${attempts} failed:`, error);
      
      if (attempts === MAX_RETRIES) {
        throw new Error('Failed to get valid response after maximum retries');
      }
      
      // Wait before retrying
      await delay(RETRY_DELAY * attempts); // Exponential backoff
    }
  }
  
  throw new Error('Failed to extract clauses'); // Fallback error
}
