import { NextResponse } from 'next/server';
import { createClient } from '@/lib/clients/supabase/server';
import { getProject } from '@/lib/db/projects';
import { E2BService } from '@/lib/services/e2b-service';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get project
    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get existing sandbox (should already be created by workspace page)
    const result = await E2BService.getSandbox(projectId, supabase);
    if (!result) {
      return NextResponse.json({ error: 'No active sandbox. Please refresh the workspace.' }, { status: 404 });
    }
    const { sandbox } = result;

    // Get working directory
    const workDir = E2BService.getTemplateWorkDir(project.template);

    // Create git archive (includes full history)
    const zipPath = `/tmp/${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.zip`;
    console.log('[Download] Creating git archive...');

    const archiveResult = await sandbox.commands.run(
      `cd ${workDir} && git archive --format=zip -o ${zipPath} HEAD`
    );

    if (archiveResult.exitCode !== 0) {
      console.error('[Download] Git archive failed:', archiveResult.stderr);
      return NextResponse.json(
        { error: 'Failed to create archive' },
        { status: 500 }
      );
    }

    // Download file from sandbox
    console.log('[Download] Downloading from sandbox...');
    const fileContent = await sandbox.files.read(zipPath, { format: 'bytes' });

    // Clean up temp file
    await sandbox.commands.run(`rm -f ${zipPath}`);

    // Create response with file download
    const fileName = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.zip`;

    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileContent.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('[Download] Error:', error);
    return NextResponse.json(
      { error: 'Failed to download project' },
      { status: 500 }
    );
  }
}
