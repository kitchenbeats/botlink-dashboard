import type { Metadata } from 'next'
import { BASE_URL } from './urls'
import { BRANDING } from './branding'

const COVER_IMAGE = new URL('/metadata/cover.png', BASE_URL).toString()

export const METADATA: Metadata = {
  title: `${BRANDING.name} | ${BRANDING.tagline}`,
  description: BRANDING.description,
  openGraph: {
    locale: 'en',
    url: BASE_URL,
    type: 'website',
    siteName: BRANDING.name,
    title: `${BRANDING.name} | ${BRANDING.tagline}`,
    description: BRANDING.description,
    images: {
      url: COVER_IMAGE,
      width: 1200,
      height: 630,
      alt: `${BRANDING.name} Share Image`,
    },
  },
  twitter: {
    card: 'summary_large_image',
    site: BRANDING.twitter,
    creator: BRANDING.twitter,
    title: `${BRANDING.name} | ${BRANDING.tagline}`,
    description: BRANDING.description,
    images: COVER_IMAGE,
  },
}
