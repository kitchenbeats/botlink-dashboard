import { NextResponse } from 'next/server';
import { createClient } from '@/lib/clients/supabase/server';
import { supabaseAdmin } from '@/lib/clients/supabase/admin';
import { isAdmin } from '@/lib/auth/admin';

/**
 * Admin Sandboxes API
 * Returns all sandboxes from database
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Verify authentication and admin status
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (via ADMIN_EMAILS env var)
    if (!isAdmin(user.email) && !isAdmin(user.id)) {
      return NextResponse.json({ error: 'Forbidden - admin only' }, { status: 403 });
    }

    // Get all sandboxes with project info
    const { data: sandboxes, error } = await supabaseAdmin
      .from('sandbox_sessions')
      .select(
        `
        id,
        e2b_session_id,
        project_id,
        template,
        status,
        created_at,
        updated_at,
        stopped_at,
        expires_at,
        projects (
          id,
          name,
          team_id
        )
      `
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Admin Sandboxes] Error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sandboxes' },
        { status: 500 }
      );
    }

    return NextResponse.json({ sandboxes: sandboxes || [] });
  } catch (error) {
    console.error('[Admin Sandboxes] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sandboxes' },
      { status: 500 }
    );
  }
}
