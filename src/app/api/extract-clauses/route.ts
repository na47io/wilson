import { NextRequest, NextResponse } from 'next/server';
import { extractClauses } from '@/lib/anthropic';
import { extractClausesOpenAI } from '@/lib/openai';

export async function POST(request: NextRequest) {
  console.log('Received clause extraction request');
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.warn('No file provided in request');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const model = formData.get('model') as string;
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log(`Processing PDF file: ${file.name} (${buffer.length} bytes) using ${model}`);

    // Update status through the global EventSource
    const { clauses, metadata, definitions } = model === 'openai' 
      ? await extractClausesOpenAI(buffer)
      : await extractClauses(buffer);
    console.log('Successfully extracted clauses and definitions from PDF');

    return NextResponse.json({
      clauses,
      metadata,
      definitions
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing PDF:', error);
    return NextResponse.json(
      { error: 'Failed to process PDF' + errorMessage },
      { status: 500 }
    );
  }
}
