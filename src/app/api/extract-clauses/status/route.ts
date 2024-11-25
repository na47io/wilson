import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const response = new NextResponse(
    new ReadableStream({
      start(controller) {
        // Keep the connection alive
        const interval = setInterval(() => {
          controller.enqueue(`data: Waiting for updates...\n\n`);
        }, 15000);

        request.signal.addEventListener('abort', () => {
          clearInterval(interval);
          controller.close();
        });
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
