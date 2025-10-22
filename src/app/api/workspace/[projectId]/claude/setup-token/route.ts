/**
 * Claude Setup Token PTY API
 *
 * Creates a PTY running `claude setup-token` for interactive authentication.
 * Uses the same pattern as terminal-pty.
 */

import { createClient } from '@/lib/clients/supabase/server';
import { getProject } from '@/lib/db/projects';
import { Sandbox } from 'e2b';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

// In-memory PTY session storage
// Key: projectId, Value: { sandbox, ptyPid, outputBuffer, tokenSaved }
const setupTokenSessions = new Map<string, {
  sandbox: Sandbox;
  ptyPid: number;
  outputBuffer: string;
  tokenSaved: boolean;
}>();

/**
 * GET - Stream setup-token PTY output via SSE
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  console.log('[Claude Setup Token] Starting for project:', projectId);

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

  // Get or restore sandbox
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
        console.log('[Claude Setup Token] Creating PTY for project:', projectId);

        // Clean up old session if exists
        const oldSession = setupTokenSessions.get(projectId);
        if (oldSession) {
          try {
            await oldSession.sandbox.pty.kill(oldSession.ptyPid);
          } catch (e) {
            // Already dead
          }
          setupTokenSessions.delete(projectId);
        }

        // Track output buffer for token detection
        let outputBuffer = '';
        let tokenSaved = false;

        console.log('[Claude Setup Token] Working directory:', workDir);

        // Create a PTY running `claude setup-token`
        const ptyHandle = await sandbox.pty.create({
          cols: 120,
          rows: 30,
          cwd: workDir,
          envs: {
            TERM: 'xterm-256color',
          },
          onData: async (data) => {
            // Stream PTY output to client
            try {
              const output = new TextDecoder().decode(data);
              console.log('[Claude Setup Token] Output:', output);

              // Add to buffer for token detection
              outputBuffer += output;

              // Send output to client
              sendEvent('data', { data: output });

              // Check if token appears in output and not yet saved
              if (!tokenSaved && outputBuffer.includes('sk-ant-')) {
                console.log('[Claude Setup Token] Token detected in output, extracting and saving...');

                // Extract token using regex (sk-ant- followed by alphanumeric and dashes)
                const tokenMatch = outputBuffer.match(/(sk-ant-[a-zA-Z0-9_-]+)/);

                if (tokenMatch && tokenMatch[1]) {
                  const token = tokenMatch[1];
                  console.log('[Claude Setup Token] Extracted token:', token.substring(0, 20) + '...');

                  // Write token to project's .claude/.token file
                  const tokenPath = `${workDir}/.claude/.token`;
                  try {
                    await sandbox.files.write(tokenPath, token);

                    // Also write to .env for automatic auth
                    const envPath = `${workDir}/.env`;
                    console.log('[Claude Setup Token] Writing ANTHROPIC_AUTH_TOKEN to .env');

                    // Read existing .env if it exists
                    let envContent = '';
                    try {
                      envContent = await sandbox.files.read(envPath);
                    } catch (e) {
                      // File doesn't exist, that's fine
                    }

                    // Add or update ANTHROPIC_AUTH_TOKEN
                    const lines = envContent.split('\n');
                    const tokenLine = `ANTHROPIC_AUTH_TOKEN=${token}`;
                    const existingIndex = lines.findIndex(line => line.startsWith('ANTHROPIC_AUTH_TOKEN='));

                    if (existingIndex !== -1) {
                      lines[existingIndex] = tokenLine;
                    } else {
                      lines.push(tokenLine);
                    }

                    await sandbox.files.write(envPath, lines.join('\n'));

                    tokenSaved = true;
                    console.log('[Claude Setup Token] Token saved to', tokenPath, 'and .env');
                    sendEvent('token_saved', { success: true });
                  } catch (error) {
                    console.error('[Claude Setup Token] Failed to save token:', error);
                    sendEvent('error', {
                      message: 'Failed to save token: ' + (error instanceof Error ? error.message : 'Unknown error')
                    });
                  }
                }
              }
            } catch (e) {
              console.error('[Claude Setup Token] Error streaming data:', e);
            }
          },
          timeoutMs: 0, // No timeout
        });

        console.log('[Claude Setup Token] PTY created with PID:', ptyHandle.pid);

        // Start `claude setup-token`
        const setupCommand = 'claude setup-token\n';
        await sandbox.pty.sendInput(
          ptyHandle.pid,
          new TextEncoder().encode(setupCommand)
        );

        console.log('[Claude Setup Token] Started command:', setupCommand.trim());

        // Store session
        setupTokenSessions.set(projectId, {
          sandbox,
          ptyPid: ptyHandle.pid,
          outputBuffer,
          tokenSaved,
        });

        console.log('[Claude Setup Token] ✓ Session stored for project:', projectId);
        console.log('[Claude Setup Token] ✓ Active sessions:', setupTokenSessions.size);

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
          console.log('[Claude Setup Token] Client disconnected');
          clearInterval(heartbeat);
          controller.close();
        });

      } catch (error) {
        console.error('[Claude Setup Token] Error:', error);
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
 * POST - Send input to setup-token PTY
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { data } = await request.json();

    console.log('[Claude Setup Token Input] Received data for project:', projectId);
    console.log('[Claude Setup Token Input] Data length:', data.length);
    console.log('[Claude Setup Token Input] Data type:', typeof data);
    console.log('[Claude Setup Token Input] Data preview:', JSON.stringify(data.substring(0, 50)));
    console.log('[Claude Setup Token Input] Full data (if short):', data.length < 10 ? JSON.stringify(data) : '(too long)');

    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log('[Claude Setup Token Input] Unauthorized');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get session
    console.log('[Claude Setup Token Input] Looking for session, active sessions:', setupTokenSessions.size);
    console.log('[Claude Setup Token Input] Session keys:', Array.from(setupTokenSessions.keys()));

    const session = setupTokenSessions.get(projectId);
    if (!session) {
      console.log('[Claude Setup Token Input] ✗ No active session found for project:', projectId);
      return Response.json({ error: 'No active setup-token session' }, { status: 404 });
    }

    console.log('[Claude Setup Token Input] Session found, PID:', session.ptyPid);

    // Send input to PTY
    const encodedData = new TextEncoder().encode(data);
    console.log('[Claude Setup Token Input] Sending to PTY, bytes:', encodedData.length);

    await session.sandbox.pty.sendInput(
      session.ptyPid,
      encodedData
    );

    console.log('[Claude Setup Token Input] ✓ Successfully sent to PTY');

    return Response.json({ success: true });

  } catch (error) {
    console.error('[Claude Setup Token Input] Error:', error);
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
    const session = setupTokenSessions.get(projectId);
    if (!session) {
      return Response.json({ error: 'No active setup-token session' }, { status: 404 });
    }

    // Resize PTY
    await session.sandbox.pty.resize(session.ptyPid, { cols, rows });

    return Response.json({ success: true });

  } catch (error) {
    console.error('[Claude Setup Token Resize] Error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to resize' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Close setup-token session
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
    const session = setupTokenSessions.get(projectId);
    if (session) {
      try {
        await session.sandbox.pty.kill(session.ptyPid);
      } catch (e) {
        // Already dead
      }
      setupTokenSessions.delete(projectId);
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('[Claude Setup Token Delete] Error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to close session' },
      { status: 500 }
    );
  }
}
