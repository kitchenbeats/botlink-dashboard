import { redirect } from 'next/navigation';
import { createClient } from '@/lib/clients/supabase/server';
import { isAdmin } from '@/lib/auth/admin';
import { TemplateManager } from '@/features/admin/template-manager';

export default async function AdminTemplatesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/sign-in');
  }

  // Check if user is admin
  if (!isAdmin(user.email) && !isAdmin(user.id)) {
    redirect('/dashboard');
  }

  return <TemplateManager />;
}
