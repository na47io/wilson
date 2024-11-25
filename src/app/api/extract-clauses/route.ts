import { NextRequest, NextResponse } from 'next/server';
import { extractClauses } from '@/lib/anthropic';

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

    const buffer = Buffer.from(await file.arrayBuffer());
    console.log(`Processing PDF file: ${file.name} (${buffer.length} bytes)`);
    
    // Send status update
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    
    writer.write(encoder.encode('data: Loading PDF document...\n\n'));
    
    const { clauses, missing_types, metadata } = await extractClauses(buffer);
    
    writer.write(encoder.encode('data: Analyzing contract clauses...\n\n'));
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    writer.write(encoder.encode('data: Extracting metadata...\n\n'));
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    writer.write(encoder.encode('data: Finalizing results...\n\n'));
    console.log('Successfully extracted clauses from PDF');
    
    return NextResponse.json({ 
      clauses,
      missingTypes: missing_types,
      metadata
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing PDF:', error);
    return NextResponse.json(
      { error: 'Failed to process PDF' },
      { status: 500 }
    );
  }
}
