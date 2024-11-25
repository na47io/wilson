import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
});

// Helper to check if we have a valid API key
const hasValidApiKey = () => {
  return process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'dummy-key-for-build';
};

const ClauseSchema = z.object({
  type: z.string(),
  summary: z.string(),
  text: z.string(),
  citation: z.string(),
});

const DefinitionSchema = z.object({
  term: z.string(),
  definition: z.string(),
  citation: z.string(),
});

const ResponseSchema = z.object({
  clauses: z.array(ClauseSchema),
  definitions: z.array(DefinitionSchema),
});

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function extractClausesOpenAI(pdfText: string) {
  if (!hasValidApiKey()) {
    throw new Error('OpenAI API key is not configured');
  }

  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    try {
      console.log(`Attempt ${attempts + 1} of ${MAX_RETRIES}`);

      const response = await openai.beta.chat.completions.parse({
        model: "gpt-4o",
        response_format: zodResponseFormat(ResponseSchema, "contract_analysis"),
        messages: [
          {
            role: "system",
            content: `You are a contract analysis expert specialized in extracting and structuring legal clauses.
Extract clauses and definitions precisely following the provided JSON schema.

Analyze this contract PDF in two steps:

1. First, extract all defined terms:
   - Look for a dedicated "Definitions" or "Terms" section
   - Find any inline definitions throughout the document
   - For each definition, capture:
     * The exact term being defined
     * The complete definition text
     * The precise location (page/section)

2. Then scan for ALL significant legal clauses, including but not limited to:
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
  "definitions": [
    {
      "term": "Confidential Information",
      "definition": "Any non-public information relating to the business, technology, or operations of either party...",
      "citation": "Page 2, Section 1.3"
    }
  ]
}
`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: pdfText
              },
            ]
          }
        ],
        max_tokens: 4000,
      });

      console.log('Received response from OpenAI API');

      const validatedContent = response.choices[0].message.parsed;

      console.log('Successfully validated response format');
      console.log('Definitions found:', validatedContent?.definitions?.length || 0);
      console.log('Clauses found:', validatedContent?.clauses?.length || 0);

      return {
        ...validatedContent,
        definitions: validatedContent?.definitions || []
      };

    } catch (error) {
      attempts++;
      console.error(`Attempt ${attempts} failed:`, error);

      if (attempts === MAX_RETRIES) {
        throw new Error('Failed to get valid response after maximum retries');
      }

      await delay(RETRY_DELAY * attempts);
    }
  }

  throw new Error('Failed to extract clauses');
}
