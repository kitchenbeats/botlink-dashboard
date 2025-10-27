import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/clients/supabase/server';
import { listMessages, createMessage } from '@/lib/db/messages';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Get conversation ID from query parameter
    const conversationId = request.nextUrl.searchParams.get('conversationId');

    // Fetch messages (filtered by conversation if provided)
    const messages = await listMessages(projectId, conversationId || undefined);

    return NextResponse.json(messages);
  } catch (error) {
    console.error('[API] Failed to fetch messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Get message data from request body
    const body = await request.json();
    const { conversationId, role, content, metadata } = body;

    if (!conversationId || !role || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: conversationId, role, content' },
        { status: 400 }
      );
    }

    // Create message
    const message = await createMessage({
      project_id: projectId,
      conversation_id: conversationId,
      role: role as 'user' | 'assistant' | 'system',
      content,
      metadata: metadata || {},
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('[API] Failed to create message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}
