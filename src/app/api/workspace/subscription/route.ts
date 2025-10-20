import { NextRequest, NextResponse } from 'next/server';
import { fetchSubscriptionToken } from '@/server/actions/workspace';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    // Get subscription token for this project's workspace channel
    const token = await fetchSubscriptionToken(projectId);

    return NextResponse.json(token);
  } catch (error) {
    console.error('[API] Subscription token error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
