import { NextRequest, NextResponse } from 'next/server';
import { sendChatMessage } from '@/server/actions/chat';
import { listMessages } from '@/lib/db/messages';

// MIGRATED: Removed export const runtime (incompatible with Cache Components)
// MIGRATED: Removed export const dynamic (incompatible with Cache Components)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, message, mode = 'simple', reviewMode = 'off', maxIterations } = body;

    if (!projectId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, message' },
        { status: 400 }
      );
    }

    // Load conversation history from database
    const dbMessages = await listMessages(projectId);
    const conversationHistory = dbMessages.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    // Call the chat action with full conversation history
    const result = await sendChatMessage(projectId, message, conversationHistory, mode, reviewMode, maxIterations);

    // Both modes return JSON response now
    // For agents mode, UI will subscribe to Inngest realtime for progress updates
    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
