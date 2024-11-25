import { NextResponse } from 'next/server';
import { getAllAnalyses } from '@/lib/db';

export async function GET() {
  try {
    const analyses = await getAllAnalyses();
    return NextResponse.json(analyses);
  } catch (error) {
    console.error('Error fetching analyses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analyses' },
      { status: 500 }
    );
  }
}
