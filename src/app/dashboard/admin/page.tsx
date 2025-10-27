import { redirect } from 'next/navigation';
import { AdminDashboard } from '@/features/admin/admin-dashboard';
import { isAdmin } from '@/lib/auth/admin';
import { checkAuthenticated } from '@/lib/utils/server';

export default async function AdminPage() {
  const { user } = await checkAuthenticated();

  // Check if user is admin (via ADMIN_EMAILS env var)
  if (!isAdmin(user.email) && !isAdmin(user.id)) {
    redirect('/dashboard');
  }

  return <AdminDashboard />;
}
