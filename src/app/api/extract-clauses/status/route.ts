import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const response = new NextResponse(
    new ReadableStream({
      start(controller) {
        // Send initial status
        controller.enqueue(`data: Initializing PDF processing...\n\n`);

        // Keep the connection alive with more frequent updates
        const interval = setInterval(() => {
          controller.enqueue(`data: Processing document...\n\n`);
        }, 2000);

        request.signal.addEventListener('abort', () => {
          clearInterval(interval);
          controller.close();
        });

        // Close the stream after 5 minutes to prevent hanging connections
        setTimeout(() => {
          clearInterval(interval);
          controller.close();
        }, 300000);
      }
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    }
  );

  return response;
}
