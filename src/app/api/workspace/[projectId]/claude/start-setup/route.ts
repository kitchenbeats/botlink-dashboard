/**
 * Start Claude Setup PTY Manager via PM2
 * Starts a bash shell for running claude setup-token
 */

import { createClient } from '@/lib/clients/supabase/server';
import { getProject } from '@/lib/db/projects';
import { E2BService } from '@/lib/services/e2b-service';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  console.log('[Claude Setup Start] ========== REQUEST RECEIVED ==========');

  try {
    const { projectId } = await params;
    console.log('[Claude Setup Start] projectId:', projectId);

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

    // Check if setup-pty process is already running
    const pm2List = await sandbox.commands.run('pm2 jlist');
    type PM2Process = { name: string; pid?: number; pm2_env?: { status: string } };
    const processes = JSON.parse(pm2List.stdout || '[]') as PM2Process[];
    const setupPtyProcess = processes.find((p) => p.name === 'claude-setup');

    if (setupPtyProcess && setupPtyProcess.pm2_env?.status === 'online') {
      console.log('[Claude Setup Start] Setup PTY already running - skipping start');
      return NextResponse.json({
        success: true,
        message: 'Setup PTY already running',
        pid: setupPtyProcess.pid,
      });
    }

    // Clean up any dead process
    if (setupPtyProcess) {
      console.log('[Claude Setup Start] Found stopped setup PTY process - deleting before restart...');
      await sandbox.commands.run('pm2 delete claude-setup || true');
    } else {
      console.log('[Claude Setup Start] Ensuring no dead claude-setup process...');
      await sandbox.commands.run('pm2 delete claude-setup || true');
    }

    // Also stop regular claude-pty if running (can't have both at once)
    console.log('[Claude Setup Start] Stopping regular claude-pty if running...');
    await sandbox.commands.run('pm2 delete claude-pty || true');

    // Start claude-setup-pty with environment variables
    console.log('[Claude Setup Start] Starting claude-setup-pty process...');

    const configPath = project.template === 'simple_site'
      ? `${workDir}/configs/claude-setup-pty.js`
      : `${workDir}/configs/claude-setup-pty.js`;

    const startCmd = `cd ${workDir} && PROJECT_ID=${projectId} REDIS_URL="${redisUrl}" WORK_DIR=${workDir} pm2 start ${configPath} --name claude-setup`;

    let startResult;
    try {
      startResult = await sandbox.commands.run(startCmd, {
        timeoutMs: 10000,
      });
    } catch (error) {
      const err = error as { result?: typeof startResult; message?: string; exitCode?: number };
      startResult = err.result || { stdout: '', stderr: err.message || '', exitCode: err.exitCode || 1 };
    }

    console.log('[Claude Setup Start] PM2 command:', startCmd);
    console.log('[Claude Setup Start] PM2 exit code:', startResult.exitCode);
    console.log('[Claude Setup Start] PM2 stdout:', startResult.stdout);
    console.log('[Claude Setup Start] PM2 stderr:', startResult.stderr);

    // Verify it started
    console.log('[Claude Setup Start] Waiting for claude-setup to start...');
    let verifyPtyProcess: PM2Process | undefined;
    const maxRetries = 5;
    const retryDelay = 1000;

    for (let i = 0; i < maxRetries; i++) {
      console.log(`[Claude Setup Start] Verification attempt ${i + 1}/${maxRetries}`);

      const verifyList = await sandbox.commands.run('pm2 jlist');
      const verifyProcesses = JSON.parse(verifyList.stdout || '[]') as PM2Process[];
      verifyPtyProcess = verifyProcesses.find((p) => p.name === 'claude-setup');

      if (verifyPtyProcess && verifyPtyProcess.pm2_env?.status === 'online') {
        console.log('[Claude Setup Start] Process verified as online');
        break;
      }

      if (i < maxRetries - 1) {
        console.log(`[Claude Setup Start] Not ready yet, waiting ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    if (!verifyPtyProcess || verifyPtyProcess.pm2_env?.status !== 'online') {
      console.error('[Claude Setup Start] Setup PTY failed to start properly after retries');
      const logs = await sandbox.commands.run('pm2 logs claude-setup --nostream --lines 20 || echo "No logs available"');
      console.error('[Claude Setup Start] PM2 logs:', logs.stdout);

      return NextResponse.json(
        { error: 'Setup PTY started but not running', logs: logs.stdout },
        { status: 500 }
      );
    }

    console.log('[Claude Setup Start] Setup PTY started successfully');
    console.log('[Claude Setup Start] ========== SUCCESS ==========');

    return NextResponse.json({
      success: true,
      message: 'Setup PTY started via PM2',
      pid: verifyPtyProcess.pid,
    });
  } catch (error) {
    console.error('[Claude Setup Start] ========== ERROR ==========', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start Setup PTY',
      },
      { status: 500 }
    );
  }
}
