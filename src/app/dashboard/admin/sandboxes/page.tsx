import { redirect } from 'next/navigation';
import { createClient } from '@/lib/clients/supabase/server';
import { SandboxManagement } from '@/features/admin/sandbox-management';
import { isAdmin } from '@/lib/auth/admin';

export default async function AdminSandboxesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Check if user is admin (via ADMIN_EMAILS env var)
  if (!isAdmin(user.email) && !isAdmin(user.id)) {
    redirect('/dashboard');
  }

  return <SandboxManagement />;
}
