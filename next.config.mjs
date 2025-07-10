import { withSentryConfig } from '@sentry/nextjs'
import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  experimental: {
    reactCompiler: true,
    ppr: true,
    staleTimes: {
      dynamic: 180,
      static: 180,
    },
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  serverExternalPackages: ['winston', 'next-logger', "fumadocs-mdx"],
  webpack: (config, { isServer }) => {
    // Handle .node files
    config.module.rules.push({
      test: /\.node$/,
      use: 'raw-loader',
    })

    // Externalize native modules to prevent webpack from trying to bundle them
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        '@napi-rs/snappy-darwin-arm64': 'commonjs @napi-rs/snappy-darwin-arm64',
        '@napi-rs/snappy-linux-x64-gnu': 'commonjs @napi-rs/snappy-linux-x64-gnu',
        '@napi-rs/snappy-win32-x64-msvc': 'commonjs @napi-rs/snappy-win32-x64-msvc',
      })
    }

    return config
  },
  trailingSlash: false,
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          // config to prevent the browser from rendering the page inside a frame or iframe and avoid clickjacking http://en.wikipedia.org/wiki/Clickjacking
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
      ],
    },
  ],
  rewrites: async () => [
    {
      source: '/ingest/static/:path*',
      destination: 'https://us-assets.i.posthog.com/static/:path*',
    },
    {
      source: '/ingest/:path*',
      destination: 'https://us.i.posthog.com/:path*',
    },
    {
      source: '/ingest/decide',
      destination: 'https://us.i.posthog.com/decide',
    },
  ],
  redirects: async () => [
    {
      source: '/docs/api/cli',
      destination: '/auth/cli',
      permanent: true,
    },
    {
      source: '/auth/sign-in',
      destination: '/sign-in',
      permanent: true,
    },
    {
      source: '/auth/sign-up',
      destination: '/sign-up',
      permanent: true,
    },
    // SEO Redirects
    {
      source: '/ai-agents/:path*',
      destination: '/',
      permanent: true
    }
  ],
  skipTrailingSlashRedirect: true,
}

export default withSentryConfig(withMDX(config), {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: 'e2b',
  project: 'dashboard',

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: '/monitoring',

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,

  // Disable source maps in development to prevent 404 errors
  hideSourceMaps: process.env.NODE_ENV === 'development',
})
