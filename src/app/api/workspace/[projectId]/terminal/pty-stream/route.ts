/**
 * PTY Terminal Stream API - E2B SDK v2
 *
 * Creates a real persistent PTY bash session using E2B's native PTY support.
 * This maintains state between commands, so interactive CLIs like `claude` work properly.
 */

import { createClient } from '@/lib/clients/supabase/server';
import { getProject } from '@/lib/db/projects';
import { getActiveSandbox } from '@/lib/db/sandboxes';
import { TeamApiKeyService } from '@/lib/services/team-api-key-service';
import { E2B_DOMAIN } from '@/configs/e2b';
import { Sandbox } from 'e2b';
import { NextRequest } from 'next/server';

// MIGRATED: Removed export const runtime (incompatible with Cache Components)

// In-memory PTY session storage
// Key: projectId, Value: { sandbox, processHandle, ptyPid, workDir, lastTimeoutExtension }
const ptySessions = new Map<string, {
  sandbox: Sandbox;
  processHandle: { kill: () => Promise<boolean> }; // Command process handle from E2B
  ptyPid: number;
  workDir: string;
  lastTimeoutExtension: number;
}>();

/**
 * GET - Stream PTY output via SSE
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  console.log('[PTY Stream] Starting for project:', projectId);

  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get project
  const project = await getProject(projectId);
  if (!project) {
    return new Response('Project not found', { status: 404 });
  }

  // Get or restore sandbox (handles snapshot restoration)
  const { E2BService } = await import('@/lib/services/e2b-service');
  const { sandbox } = await E2BService.getOrCreateSandboxWithSnapshot(projectId, supabase);

  // Get working directory
  const workDir = E2BService.getTemplateWorkDir(project.template);

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Helper to send SSE message
      const sendEvent = (type: string, data: Record<string, unknown>) => {
        const message = `data: ${JSON.stringify({ type, ...data })}\n\n`;
        controller.enqueue(encoder.encode(message));
      };

      try {
        // Always create a fresh PTY for each new connection
        // (avoids issues with stale PTYs after sandbox pause/resume)
        console.log('[PTY Stream] Creating new PTY session for project:', projectId);

        // Clean up old session if exists
        const oldSession = ptySessions.get(projectId);
        if (oldSession) {
          try {
            await oldSession.sandbox.pty.kill(oldSession.ptyPid);
          } catch (e) {
            // Already dead, that's okay
          }
          ptySessions.delete(projectId);
        }

        // Create a proper PTY
          const ptyHandle = await sandbox.pty.create({
            cols: 80,
            rows: 24,
            cwd: workDir,
            envs: {
              TERM: 'xterm-256color',
              PS1: '\\u@e2b:\\w\\$ ',
            },
            onData: (data) => {
              // Stream PTY output to client
              try {
                // Convert Uint8Array to string
                const output = new TextDecoder().decode(data);
                sendEvent('data', { data: output });
              } catch (e) {
                console.error('[PTY Stream] Error streaming data:', e);
              }
            },
            timeoutMs: 0, // No timeout
          });

          console.log('[PTY Stream] PTY created with PID:', ptyHandle.pid);

          // PTY created - send initial newline to trigger shell prompt
          // (pty.create may auto-start a shell)
          await sandbox.pty.sendInput(
            ptyHandle.pid,
            new TextEncoder().encode('\n')
          );

          // Store session
          const session = {
            sandbox,
            processHandle: ptyHandle,
            ptyPid: ptyHandle.pid,
            workDir,
            lastTimeoutExtension: Date.now(),
          };
          ptySessions.set(projectId, session);

          sendEvent('connected', { pid: ptyHandle.pid });

        // Keep connection alive with heartbeat
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(': heartbeat\n\n'));
          } catch (e) {
            clearInterval(heartbeat);
          }
        }, 15000);

        // Wait for client disconnect
        request.signal.addEventListener('abort', () => {
          console.log('[PTY Stream] Client disconnected');
          clearInterval(heartbeat);
          controller.close();
        });

      } catch (error) {
        console.error('[PTY Stream] Error:', error);
        sendEvent('error', {
          message: error instanceof Error ? error.message : 'Unknown error'
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * POST - Send input to PTY
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { data } = await request.json();

    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get session
    const session = ptySessions.get(projectId);
    if (!session) {
      return Response.json({ error: 'No active PTY session' }, { status: 404 });
    }

    // Extend sandbox timeout on activity (throttled to once per 30 seconds)
    const now = Date.now();
    const timeSinceLastExtension = now - session.lastTimeoutExtension;
    const THROTTLE_MS = 30000; // 30 seconds

    if (timeSinceLastExtension > THROTTLE_MS) {
      const { E2BService } = await import('@/lib/services/e2b-service');
      const { TeamApiKeyService } = await import('@/lib/services/team-api-key-service');
      const project = await getProject(projectId);
      if (project) {
        const teamApiKey = await TeamApiKeyService.getTeamApiKey(project.team_id, supabase);
        E2BService.extendSandboxTimeout(session.sandbox.sandboxId, teamApiKey).catch(console.error);
        session.lastTimeoutExtension = now;
      }
    }

    // Send input to PTY
    await session.sandbox.pty.sendInput(
      session.ptyPid,
      new TextEncoder().encode(data)
    );

    return Response.json({ success: true });

  } catch (error) {
    console.error('[PTY Input] Error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to send input' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Resize PTY
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { cols, rows } = await request.json();

    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get session
    const session = ptySessions.get(projectId);
    if (!session) {
      return Response.json({ error: 'No active PTY session' }, { status: 404 });
    }

    // Try to resize PTY (may not be supported for commands.run PTY)
    try {
      await session.sandbox.pty.resize(session.ptyPid, { cols, rows });
    } catch (error) {
      // Resize not supported for this PTY type, that's okay
      console.log('[PTY Resize] Resize not supported, ignoring:', error);
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('[PTY Resize] Error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to resize' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Close PTY session
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get session
    const session = ptySessions.get(projectId);
    if (session) {
      try {
        await session.sandbox.pty.kill(session.ptyPid);
      } catch (e) {
        // Already dead
      }
      ptySessions.delete(projectId);
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('[PTY Delete] Error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to close PTY' },
      { status: 500 }
    );
  }
}
