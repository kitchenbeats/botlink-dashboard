/**
 * Claude Chat API
 *
 * Executes claude-chat.js script in sandbox with Redis-backed conversation history
 */

import { createClient } from '@/lib/clients/supabase/server';
import { getProject } from '@/lib/db/projects';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * POST - Send message to Claude via SDK in sandbox with conversation history
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { message } = await request.json();

    console.log('[Claude Chat API] Message for project:', projectId);

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

    // Get sandbox
    const { E2BService } = await import('@/lib/services/e2b-service');
    const { sandbox } = await E2BService.getOrCreateSandboxWithSnapshot(projectId, supabase);
    const workDir = E2BService.getTemplateWorkDir(project.template);
    const tokenPath = `${workDir}/.claude/.token`;

    console.log('[Claude Chat API] Checking token exists at:', tokenPath);

    // Check auth token exists
    try {
      const token = await sandbox.files.read(tokenPath);
      if (!token || !token.trim()) {
        return new Response('Not authenticated - no token found', { status: 401 });
      }
    } catch (error) {
      return new Response('Not authenticated - token file not found', { status: 401 });
    }

    // Get Redis URL from env
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      return new Response('Redis not configured', { status: 500 });
    }

    console.log('[Claude Chat API] Executing agentic claude-chat.js');

    // Execute claude-chat.js with PROJECT_ID, REDIS_URL, and WORK_DIR
    // The script:
    // - Loads conversation history from Redis
    // - Injects recent changes into context
    // - Runs agentic loop with tool execution
    // - Outputs structured JSON (thinking, tool_use, tool_result, text, done)
    // - Saves updated history and changes back to Redis
    const result = await sandbox.commands.run(
      `cd ${workDir} && PROJECT_ID=${projectId} REDIS_URL="${redisUrl}" WORK_DIR=${workDir} node configs/claude-chat.js "${message}"`
    );

    // Stream the JSON output directly
    // The script outputs one JSON object per line in format:
    // {type: 'thinking', text: '...'}
    // {type: 'tool_use', name: '...', input: {...}}
    // {type: 'tool_result', tool_use_id: '...', name: '...', result: {...}}
    // {type: 'text', text: '...'}
    // {type: 'done', iterations: N, changes: N}
    // {type: 'error', error: '...'}
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Split output into lines and send each JSON object
          const lines = result.stdout.split('\n');

          for (const line of lines) {
            if (line.trim()) {
              controller.enqueue(encoder.encode(line + '\n'));
            }
          }

          controller.close();
        } catch (error) {
          console.error('[Claude Chat API] Error:', error);
          const errorMsg = JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          }) + '\n';
          controller.enqueue(encoder.encode(errorMsg));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('[Claude Chat API] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
