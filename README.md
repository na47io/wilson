# AI Legal Document Analyzer

A Next.js application that extracts and analyzes clauses from legal documents using OpenAI's GPT-4.

## Architecture

- **Frontend**: Next.js with TypeScript and Tailwind CSS
  - PDF document upload interface
  - Real-time analysis status updates via SSE
  - Interactive clause and definition display
  - Document history sidebar
  
- **Backend**: Next.js API Routes
  - PDF text extraction with pdf-parse
  - OpenAI API integration with retry logic
  - SQLite database for analysis persistence
  
- **Storage**: SQLite3
  - Stores document analyses
  - Maintains document metadata
  - Enables historical analysis retrieval

## Flow

1. User uploads PDF
2. System extracts text and metadata
3. OpenAI processes content to identify:
   - Legal clauses with type, summary, text
   - Defined terms with definitions
   - Document metadata
4. Results are stored in SQLite
5. UI updates in real-time via SSE

## Database Design

SQLite was chosen for:
- Zero-config deployment
- Built-in JSON support
- Single-file database
- Reliable transaction support
- Easy backup (just copy the file)
- Sufficient for most legal document workflows

## OpenAI Integration

- Uses GPT-4 with structured output
- Implements retry logic with exponential backoff
- Validates responses using Zod schemas
- Handles rate limiting and errors

## Future Work

1. Performance
   - Implement prompt caching
   - Add response caching layer
   - Optimize large PDF handling

2. Model Support
   - Add support for multiple LLM providers
   - Implement model comparison features
   - Add Claude/Anthropic integration

3. Evaluation
   - Add clause detection accuracy metrics
   - Implement definition coverage analysis
   - Add legal accuracy verification tools

## Deployment

Deploys via [Kamal](https://github.com/basecamp/kamal) to personal hosting.

## Development Notes

Built with [aider](https://github.com/paul-gauthier/aider). Was fun, feel like i would be faster without. Probably a skill issue.

Check commit history for development progression.

## Local setup

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
