import { NextRequest, NextResponse } from 'next/server';
import { extractClausesOpenAI } from '@/lib/openai';
import { saveAnalysis } from '@/lib/db';
import { AnalysisResult } from '@/lib/models';
import pdf from 'pdf-parse';

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
    const data = await pdf(buffer)
    console.log(`Processing PDF file: ${file.name} (${buffer.length} bytes) using ${model}`);

    // Update status through the global EventSource
    const { clauses, definitions } = await extractClausesOpenAI(data.text)
    console.log('Successfully extracted clauses and definitions from PDF');


    const result = {
      clauses,
      metadata: {
        title: data.info.Title,
        author: data.info.Author,
        subject: data.info.Subject,
        creationDate: data.info.CreationDate,
        modificationDate: data.info.ModDate,
      },
      definitions
    };

    // Save to database
    await saveAnalysis(file.name, result as AnalysisResult);

    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing PDF:', error);
    return NextResponse.json(
      { error: 'Failed to process PDF' + errorMessage },
      { status: 500 }
    );
  }
}
