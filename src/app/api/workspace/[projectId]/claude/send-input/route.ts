/**
 * Send input to Claude PTY via Redis
 * Publishes to Redis channel that the PM2-managed PTY manager subscribes to
 */

import { createClient } from '@/lib/clients/supabase/server';
import { getProject } from '@/lib/db/projects';
import { kv } from '@/lib/clients/kv';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 5;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 });
    }

    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get project (verify access)
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Publish input to Redis for PTY manager to pick up
    await kv.publish(
      `workspace:${projectId}:claude-input`,
      JSON.stringify({
        data: message,
        timestamp: Date.now(),
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Claude Input] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to send input',
      },
      { status: 500 }
    );
  }
}
