import { NextRequest, NextResponse } from 'next/server';
import { sendChatMessage } from '@/server/actions/chat';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, message, mode = 'simple' } = body;

    if (!projectId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, message' },
        { status: 400 }
      );
    }

    // Call the chat action
    const result = await sendChatMessage(projectId, message, [], mode);

    // For simple mode, return JSON response
    if (mode === 'simple') {
      return NextResponse.json(result);
    }

    // For agents mode, return streaming response
    return result;
  } catch (error) {
    console.error('[API] Chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
