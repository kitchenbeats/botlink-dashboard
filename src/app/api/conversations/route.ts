import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/clients/supabase/server';
import { listProjectConversations, createNewConversation } from '@/server/actions/conversations';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = request.nextUrl.searchParams.get('projectId');
    if (!projectId) {
      return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });
    }

    // Verify user has access to this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, team_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Verify user is part of the team
    const { data: membership } = await supabase
      .from('users_teams')
      .select('team_id')
      .eq('user_id', user.id)
      .eq('team_id', (project as { id: string; team_id: string }).team_id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch conversations
    const result = await listProjectConversations({ projectId });

    if (!result?.data) {
      return NextResponse.json({ error: 'Failed to load conversations' }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[API] Failed to fetch conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, name, description } = body;

    if (!projectId || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, name' },
        { status: 400 }
      );
    }

    // Verify user has access to this project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, team_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Verify user is part of the team
    const { data: membership } = await supabase
      .from('users_teams')
      .select('team_id')
      .eq('user_id', user.id)
      .eq('team_id', (project as { id: string; team_id: string }).team_id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create conversation
    const result = await createNewConversation({ projectId, name, description });

    if (!result?.data) {
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[API] Failed to create conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}
