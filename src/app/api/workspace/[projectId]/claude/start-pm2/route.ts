/**
 * Start Claude PTY Manager via PM2
 * Starts the claude-pty PM2 process with project-specific env vars
 */

import { createClient } from '@/lib/clients/supabase/server';
import { getProject } from '@/lib/db/projects';
import { E2BService } from '@/lib/services/e2b-service';
import { TeamApiKeyService } from '@/lib/services/team-api-key-service';
import { E2B_DOMAIN } from '@/configs/e2b';
import { Sandbox } from 'e2b';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  console.log('[Claude PM2 Start] ========== REQUEST RECEIVED ==========');

  try {
    const { projectId } = await params;
    console.log('[Claude PM2 Start] projectId:', projectId);

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
    const workDir = E2BService.getTemplateWorkDir(project.template);

    // Get Redis URL from env
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      return NextResponse.json({ error: 'Redis not configured' }, { status: 500 });
    }

    // Check if claude-pty process is already running
    const pm2List = await sandbox.commands.run('pm2 jlist');
    type PM2Process = { name: string; pid?: number; pm2_env?: { status: string } };
    const processes = JSON.parse(pm2List.stdout || '[]') as PM2Process[];
    const claudePtyProcess = processes.find((p) => p.name === 'claude-pty');

    if (claudePtyProcess && claudePtyProcess.pm2_env?.status === 'online') {
      console.log('[Claude PM2 Start] Claude PTY already running - skipping start');
      return NextResponse.json({
        success: true,
        message: 'Claude PTY already running',
        pid: claudePtyProcess.pid,
      });
    }

    // If we get here, either:
    // 1. Process doesn't exist at all
    // 2. Process exists but is stopped/crashed/errored (NOT online)
    // In either case, clean up any dead process before starting fresh
    if (claudePtyProcess) {
      console.log('[Claude PM2 Start] Found stopped/crashed claude-pty process - deleting before restart...');
      await sandbox.commands.run('pm2 delete claude-pty || true');
    } else {
      // Even if we didn't find it in the list, try to delete anyway (in case PM2 is out of sync)
      console.log('[Claude PM2 Start] Ensuring no dead claude-pty process...');
      await sandbox.commands.run('pm2 delete claude-pty || true');
    }

    // Start claude-pty with environment variables
    console.log('[Claude PM2 Start] Starting claude-pty process...');

    // Determine config path based on template
    const configPath = project.template === 'simple_site'
      ? `${workDir}/configs/claude-pty-manager.js`
      : `${workDir}/configs/claude-pty-manager.js`;

    const startCmd = `cd ${workDir} && PROJECT_ID=${projectId} REDIS_URL="${redisUrl}" WORK_DIR=${workDir} pm2 start ${configPath} --name claude-pty || pm2 restart claude-pty --update-env`;

    // Don't throw on errors - we'll check if it actually started afterward
    let startResult;
    try {
      startResult = await sandbox.commands.run(startCmd, {
        timeoutMs: 10000,
      });
    } catch (error) {
      // E2B throws on non-zero exit codes, but we want to see the output anyway
      const err = error as { result?: typeof startResult; message?: string; exitCode?: number };
      startResult = err.result || { stdout: '', stderr: err.message || '', exitCode: err.exitCode || 1 };
    }

    console.log('[Claude PM2 Start] PM2 command:', startCmd);
    console.log('[Claude PM2 Start] PM2 exit code:', startResult.exitCode);
    console.log('[Claude PM2 Start] PM2 stdout:', startResult.stdout);
    console.log('[Claude PM2 Start] PM2 stderr:', startResult.stderr);

    // Verify it started
    const verifyList = await sandbox.commands.run('pm2 jlist');
    const verifyProcesses = JSON.parse(verifyList.stdout || '[]') as PM2Process[];
    const verifyPtyProcess = verifyProcesses.find((p) => p.name === 'claude-pty');

    if (!verifyPtyProcess || verifyPtyProcess.pm2_env?.status !== 'online') {
      console.error('[Claude PM2 Start] Claude PTY failed to start properly');

      // Get logs for debugging
      const logs = await sandbox.commands.run('pm2 logs claude-pty --nostream --lines 20');
      console.error('[Claude PM2 Start] PM2 logs:', logs.stdout);

      return NextResponse.json(
        { error: 'Claude PTY started but not running', logs: logs.stdout },
        { status: 500 }
      );
    }

    console.log('[Claude PM2 Start] Claude PTY started successfully');
    console.log('[Claude PM2 Start] ========== SUCCESS ==========');

    return NextResponse.json({
      success: true,
      message: 'Claude PTY started via PM2',
      pid: verifyPtyProcess.pid,
    });
  } catch (error) {
    console.error('[Claude PM2 Start] ========== ERROR ==========', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start Claude PTY',
      },
      { status: 500 }
    );
  }
}
