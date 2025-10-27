import { NextResponse } from 'next/server';
import { createClient } from '@/lib/clients/supabase/server';
import { isAdmin } from '@/lib/auth/admin';

/**
 * Admin Stats API
 * Returns platform-wide statistics
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

    // Get platform stats using service role for admin queries
    const { supabaseAdmin: adminClient } = await import('@/lib/clients/supabase/admin');

    // User stats (count distinct users from users_teams - only users who joined teams)
    const { data: userTeams } = await adminClient
      .from('users_teams')
      .select('user_id');

    const totalUsers = new Set(userTeams?.map(ut => ut.user_id) || []).size;

    // Team stats
    const { count: totalTeams } = await adminClient
      .from('teams')
      .select('*', { count: 'exact', head: true });

    // Project stats
    const { count: totalProjects } = await adminClient
      .from('projects')
      .select('*', { count: 'exact', head: true });

    // Sandbox stats
    const { count: totalSandboxes } = await adminClient
      .from('sandbox_sessions')
      .select('*', { count: 'exact', head: true });

    const { count: activeSandboxes } = await adminClient
      .from('sandbox_sessions')
      .select('*', { count: 'exact', head: true })
      .in('status', ['ready', 'starting']);

    // Conversation stats
    const { count: totalConversations } = await adminClient
      .from('conversations')
      .select('*', { count: 'exact', head: true });

    // Message stats
    const { count: totalMessages } = await adminClient
      .from('messages')
      .select('*', { count: 'exact', head: true });

    // Get subscription breakdown (from teams table)
    const { data: teamsByTier } = await adminClient
      .from('teams')
      .select('tier:tier_id(name)');

    const subscriptionBreakdown = (teamsByTier || []).reduce((acc: Record<string, number>, team: any) => {
      const tierName = team.tier?.name || 'unknown';
      acc[tierName] = (acc[tierName] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json({
      users: {
        total: totalUsers || 0,
      },
      teams: {
        total: totalTeams || 0,
        bySubscription: subscriptionBreakdown,
      },
      projects: {
        total: totalProjects || 0,
      },
      sandboxes: {
        total: totalSandboxes || 0,
        active: activeSandboxes || 0,
        paused: (totalSandboxes || 0) - (activeSandboxes || 0),
      },
      conversations: {
        total: totalConversations || 0,
      },
      messages: {
        total: totalMessages || 0,
      },
    });
  } catch (error) {
    console.error('[Admin Stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
