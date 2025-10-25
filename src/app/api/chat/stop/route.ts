import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/clients/kv';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Stop an ongoing agent execution
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing required field: projectId' },
        { status: 400 }
      );
    }

    // Set stop flag in Redis with 5 minute expiration
    const stopKey = `agent:stop:${projectId}`;
    await kv.set(stopKey, '1', { ex: 300 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Stop agent error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
