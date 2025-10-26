/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Moved from experimental in Next.js 16
  reactCompiler: true,
  // Disabled for now - enable when ready to adopt Cache Components model
  // cacheComponents: true,
  // Turbopack is now default in v16, adding empty config to acknowledge webpack usage
  turbopack: {},
  experimental: {
    serverComponentsHmrCache: false, // defaults to true
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
  serverExternalPackages: ['pino', 'pino-loki', 'redis', '@redis/client', 'e2b'],
  trailingSlash: false,
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.node$/,
      use: 'node-loader',
    })

    // Handle e2b package that uses node: imports
    // e2b SDK v2 is server-only, so we need to exclude it from client bundles
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        'fs/promises': false,
        crypto: false,
        events: false,
        assert: false,
      }

      // Externalize e2b for client bundles (it's server-only)
      config.externals = config.externals || []
      config.externals.push('e2b')
    }

    return config
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          // config to prevent the browser from rendering the page inside a frame or iframe and avoid clickjacking http://en.wikipedia.org/wiki/Clickjacking
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
      ],
    },
  ],
  rewrites: async () => {
    return [
      {
        source: '/ph-proxy/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ph-proxy/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ]
  },
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
      permanent: true,
    },
  ],
  skipTrailingSlashRedirect: true,
}

export default config
