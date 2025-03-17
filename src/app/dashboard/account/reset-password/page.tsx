import DashboardPageLayout from '@/features/dashboard/page-layout'
import ResetPasswordForm from '@/features/auth/reset-password-form'

export default function ResetPasswordPage() {
  return (
    <DashboardPageLayout
      title="Reset password"
      className="p-6"
      classNames={{ frameWrapper: 'w-fit' }}
    >
      <ResetPasswordForm />
    </DashboardPageLayout>
  )
}
