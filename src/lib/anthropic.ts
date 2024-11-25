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
});

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

import { PDFDocument } from 'pdf-lib';

interface PdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creationDate?: string;
  modificationDate?: string;
  creator?: string;
  producer?: string;
}

async function getPdfMetadata(pdfBuffer: Buffer): Promise<PdfMetadata> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const metadata = pdfDoc.getTitle() || pdfDoc.getSubject() || pdfDoc.getAuthor() || pdfDoc.getKeywords() || pdfDoc.getCreator() || pdfDoc.getProducer();
  
  return {
    title: pdfDoc.getTitle(),
    author: pdfDoc.getAuthor(),
    subject: pdfDoc.getSubject(),
    keywords: pdfDoc.getKeywords(),
    creator: pdfDoc.getCreator(),
    producer: pdfDoc.getProducer(),
    creationDate: pdfDoc.getCreationDate()?.toISOString(),
    modificationDate: pdfDoc.getModificationDate()?.toISOString()
  };
}

export async function extractClauses(pdfBuffer: Buffer) {
  const metadata = await getPdfMetadata(pdfBuffer);
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
              text: `Analyze this contract PDF comprehensively following these steps:

1. Thoroughly scan the document for ALL significant legal clauses, including but not limited to:
   - Definitions (key terms and their meanings)
   - Representations & Warranties (statements of fact by parties)
   - Payment Terms (financial obligations and schedules)
   - Confidentiality (protection of sensitive information)
   - Intellectual Property (ownership and rights)
   - Termination (conditions and process for ending)
   - Indemnification (compensation obligations)
   - Liability (limitations and allocations)
   - Force Majeure (uncontrollable events)
   - Governing Law (applicable jurisdiction)
   - Dispute Resolution (conflict handling process)
   - Assignment (transfer of rights)
   - Severability (partial invalidity handling)
   - Amendment (modification process)
   - Entire Agreement (superseding prior agreements)
   - Any other important clauses you identify

2. For each clause found:
   - Extract the exact text verbatim
   - Write a clear 2-3 sentence summary capturing key points
   - Note the precise page number and section location
   - Categorize it under the most appropriate type

3. Before responding:
   - Ensure accurate categorization of each clause
   - Verify all citations are complete and precise
   - Validate JSON structure
   - Note any standard clause types that are notably absent

Respond ONLY with JSON in this exact format:

{
  "clauses": [
    {
      "type": "Payment Terms",
      "summary": "Client must pay within 30 days of invoice receipt. Late payments incur a 1.5% monthly interest charge. All fees are non-refundable unless explicitly stated otherwise.",
      "text": "Payment shall be made within thirty (30) days of receipt of invoice...",
      "citation": "Page 3, Section 4.1, Paragraph 2"
    }
  ],
  "missing_types": ["Force Majeure", "Assignment"]
}

Validation checklist:
✓ Each clause has a clear, specific type
✓ Summaries are 2-3 complete sentences
✓ Text contains exact quotes only
✓ Citations include page number and specific location
✓ Missing_types lists notably absent standard clauses
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
      return {
        ...validatedContent,
        metadata
      };

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
