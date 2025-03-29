import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google'
/* import localFont from 'next/font/local' */

export const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-ibm-plex-mono',
  weight: ['400', '700'],
})

export const sans = IBM_Plex_Sans({
  subsets: ['latin'],
  variable: '--font-ibm-plex-sans',
  weight: ['200', '300', '400', '500', '600', '700'],
})

/* export const aeonik = localFont({
  src: [
    {
      path: './AeonikPro-VF.ttf',
      style: 'normal',
      weight: '100 900',
    },
    {
      path: './AeonikPro-Italic-VF.ttf',
      style: 'italic',
      weight: '100 900',
    },
  ],
  variable: '--font-aeonik',
  fallback: ['sans-serif'],
}) */
