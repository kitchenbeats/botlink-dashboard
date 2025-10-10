'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserTeams } from '@/lib/db/teams';

interface OnboardingResult {
  success: boolean;
  error?: string;
  teamId?: string;
}

/**
 * Complete user onboarding
 * In E2B architecture, teams are auto-created on signup via database trigger.
 * This just verifies the team exists and redirects to dashboard.
 */
export async function completeOnboarding(): Promise<OnboardingResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Check if user has a team (should be auto-created by trigger)
    const teams = await getUserTeams(user.id);

    if (teams.length === 0) {
      return {
        success: false,
        error: 'No team found. Team should be auto-created on signup.',
      };
    }

    return { success: true, teamId: teams[0].id };
  } catch (error: any) {
    console.error('[completeOnboarding] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete onboarding',
    };
  }
}

/**
 * Check if user needs onboarding
 * In E2B, teams are auto-created, so onboarding just checks if team exists
 */
export async function checkOnboardingStatus(): Promise<{
  needsOnboarding: boolean;
  hasTeam: boolean;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { needsOnboarding: true, hasTeam: false };
    }

    const teams = await getUserTeams(user.id);

    return {
      needsOnboarding: teams.length === 0,
      hasTeam: teams.length > 0,
    };
  } catch (error) {
    console.error('[checkOnboardingStatus] Error:', error);
    return { needsOnboarding: true, hasTeam: false };
  }
}

/**
 * Redirect to appropriate page after auth
 */
export async function handleAuthRedirect() {
  const status = await checkOnboardingStatus();

  if (status.needsOnboarding) {
    // Wait a moment for trigger to fire, then redirect to dashboard
    // In most cases team should exist immediately
    redirect('/dashboard');
  } else {
    redirect('/dashboard');
  }
}
