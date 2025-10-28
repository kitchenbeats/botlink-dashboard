import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AdminDashboard } from '@/features/admin/admin-dashboard';
import { isAdmin } from '@/lib/auth/admin';
import { checkAuthenticated } from '@/lib/utils/server';
import { AdminPageSkeleton } from '@/ui/loading-skeletons';

async function AdminContent() {
  const { user } = await checkAuthenticated();

  // Check if user is admin (via ADMIN_EMAILS env var)
  if (!isAdmin(user.email) && !isAdmin(user.id)) {
    redirect('/dashboard');
  }

  return <AdminDashboard />;
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <AdminContent />
    </Suspense>
  );
}
