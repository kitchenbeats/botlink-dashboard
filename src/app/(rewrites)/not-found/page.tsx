import NotFound from '@/ui/not-found'
import { Metadata } from 'next'

// MIGRATED: Removed export const dynamic (incompatible with Cache Components)

export const metadata: Metadata = {
  title: '404 - Page Not Found',
  description:
    'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.',
  robots: 'noindex, nofollow',
}

export default function NotFoundShell() {
  return <NotFound />
}
