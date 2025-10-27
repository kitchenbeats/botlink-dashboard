import { createClient } from '@/lib/clients/supabase/server';
import { E2BService } from '@/lib/services/e2b-service';
import { getProject } from '@/lib/db/projects';
import { NextResponse } from 'next/server';

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // All templates now use port 3000
    const port = 3000;

    // Get sandbox host URL with port - getHost() returns just the hostname, so we need to add https://
    const hostname = sandbox.getHost(port);
    const previewUrl = `https://${hostname}`;

    console.log('[Preview] Project:', projectId);
    console.log('[Preview] Template:', project.template);
    console.log('[Preview] Sandbox ID:', sandbox.sandboxId);
    console.log('[Preview] Generated URL:', previewUrl);
    console.log('[Preview] Port:', port);

    return NextResponse.json({ url: previewUrl });
  } catch (error) {
    console.error('[Preview] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
