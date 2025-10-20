/**
 * Send raw input to Claude PTY
 * Used by terminal interface for character-by-character input
 */

import { createClient } from '@/lib/clients/supabase/server';
import { getProject } from '@/lib/db/projects';
import { E2BService } from '@/lib/services/e2b-service';
import { TeamApiKeyService } from '@/lib/services/team-api-key-service';
import { getClaudePtyPid } from '@/lib/services/redis-realtime';
import { E2B_DOMAIN } from '@/configs/e2b';
import { Sandbox } from 'e2b';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 10;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { data: inputData } = await request.json();

    if (!inputData) {
      return NextResponse.json({ error: 'Missing input data' }, { status: 400 });
    }

    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get project
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get sandbox
    const { sandbox } = await E2BService.getOrCreateSandboxWithSnapshot(projectId, supabase);

    // Get Claude PTY PID from Redis
    const pid = await getClaudePtyPid(projectId);

    if (!pid) {
      return NextResponse.json(
        { error: 'No active Claude session. Please start Claude Code first.' },
        { status: 404 }
      );
    }

    // Send raw input to PTY (no newline added - terminal controls that)
    const encoder = new TextEncoder();
    const bytes = encoder.encode(inputData);
    await sandbox.pty.sendInput(pid, bytes);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PTY Input] Error:', error);

    // Check if it's a "process not found" error
    if (error instanceof Error && error.message.includes('not_found')) {
      return NextResponse.json(
        { error: 'Claude session expired. Please restart Claude Code.' },
        { status: 410 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to send input',
      },
      { status: 500 }
    );
  }
}
