import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/clients/supabase/server';
import { getWorkflows } from '@/lib/db/workflows';

/**
 * GET /api/workflows
 * Load user's custom workflows for a team
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamId = request.nextUrl.searchParams.get('teamId');
    if (!teamId) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 });
    }

    // Load workflows for this team
    const workflows = await getWorkflows(teamId);

    // Return simplified workflow list for UI
    const workflowList = workflows.map((workflow) => ({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
    }));

    return NextResponse.json(workflowList);
  } catch (error) {
    console.error('[API] Failed to load workflows:', error);
    return NextResponse.json(
      { error: 'Failed to load workflows' },
      { status: 500 }
    );
  }
}
