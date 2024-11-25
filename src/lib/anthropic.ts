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
        system: `You are a contract analysis expert specialized in extracting and structuring legal clauses. You must:
1. Always respond with valid JSON only
2. Follow the exact schema provided
3. Be thorough and precise in clause identification
4. Validate your response before sending`,
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
              text: `Follow these steps to analyze the contract PDF:

1. First, scan the document for these specific clause types:
   - Indemnification clauses
   - Termination clauses
   - Liability clauses

2. For each clause found:
   - Extract the exact text
   - Write a clear 2-3 sentence summary
   - Note the precise page number and location
   - Validate it matches the expected type

3. Before responding:
   - Verify each clause is correctly categorized
   - Check that all citations are complete
   - Ensure the JSON structure is valid
   - List any clause types not found

Respond ONLY with JSON in this exact format:

{
  "clauses": [
    {
      "type": "Indemnification",
      "summary": "The vendor agrees to indemnify the client against all losses. This includes coverage for third-party claims and legal fees. The indemnification excludes cases of client negligence.",
      "text": "Vendor shall indemnify and hold harmless the Client...",
      "citation": "Page 12, Section 8.2, Paragraph 3"
    }
  ],
  "missing_types": ["Liability"]
}

Validation checklist:
✓ Each clause has exactly one type: Indemnification, Termination, or Liability
✓ Summaries are 2-3 complete sentences
✓ Text contains exact quotes only
✓ Citations include page number and specific location
✓ Missing_types lists any unfound clause types
✓ Output is valid JSON with no additional text`
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
      console.log(validatedContent)
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
