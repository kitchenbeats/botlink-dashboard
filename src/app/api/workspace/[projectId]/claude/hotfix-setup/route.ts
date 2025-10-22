/**
 * Hotfix Setup PTY File
 * Uploads missing claude-setup-pty.js to existing sandbox
 */

import { createClient } from '@/lib/clients/supabase/server';
import { getProject } from '@/lib/db/projects';
import { E2BService } from '@/lib/services/e2b-service';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  console.log('[Hotfix Setup] ========== REQUEST RECEIVED ==========');

  try {
    const { projectId } = await params;
    console.log('[Hotfix Setup] projectId:', projectId);

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

    console.log('[Hotfix Setup] Reading local claude-setup-pty.js file...');

    // Read the claude-setup-pty.js file from local filesystem
    const localFilePath = path.join(
      process.cwd(),
      'e2b-templates',
      project.template === 'simple_site' ? 'simple-html' : 'nextjs-basic',
      'configs',
      'claude-setup-pty.js'
    );

    console.log('[Hotfix Setup] Local file path:', localFilePath);

    let fileContent: string;
    try {
      fileContent = await fs.readFile(localFilePath, 'utf-8');
      console.log('[Hotfix Setup] File read successfully, size:', fileContent.length, 'bytes');
    } catch (readError) {
      console.error('[Hotfix Setup] Failed to read local file:', readError);
      return NextResponse.json(
        { error: 'Failed to read setup file from local filesystem' },
        { status: 500 }
      );
    }

    // Create configs directory if it doesn't exist
    console.log('[Hotfix Setup] Creating configs directory in sandbox...');
    await sandbox.commands.run(`mkdir -p ${workDir}/configs`);

    // Write the file to sandbox
    console.log('[Hotfix Setup] Uploading claude-setup-pty.js to sandbox...');
    const targetPath = `${workDir}/configs/claude-setup-pty.js`;

    await sandbox.files.write(targetPath, fileContent);
    console.log('[Hotfix Setup] File uploaded successfully');

    // Make it executable
    console.log('[Hotfix Setup] Making file executable...');
    await sandbox.commands.run(`chmod +x ${targetPath}`);

    // Verify file exists
    const verifyCmd = await sandbox.commands.run(`ls -lh ${targetPath}`);
    console.log('[Hotfix Setup] Verification:', verifyCmd.stdout);

    console.log('[Hotfix Setup] ========== SUCCESS ==========');

    return NextResponse.json({
      success: true,
      message: 'Setup PTY file uploaded successfully',
      path: targetPath,
      size: fileContent.length,
    });
  } catch (error) {
    console.error('[Hotfix Setup] ========== ERROR ==========', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload setup file',
      },
      { status: 500 }
    );
  }
}
