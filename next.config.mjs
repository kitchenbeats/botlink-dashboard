import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: false,
  experimental: {
    reactCompiler: true,
    reactOwnerStack: true,
    ppr: true,
    useCache: true,
    staleTimes: {
      dynamic: 180,
      static: 180,
    },
  },
  serverExternalPackages: ["pino", "pino-pretty"],
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        {
          // config to prevent the browser from rendering the page inside a frame or iframe and avoid clickjacking http://en.wikipedia.org/wiki/Clickjacking
          key: "X-Frame-Options",
          value: "SAMEORIGIN",
        },
      ],
    },
  ],
  rewrites: async () => ({
    beforeFiles: [
      {
        source: "/docs/:path*",
        destination: `https://e2b-docs.vercel.app/docs/:path*`,
      },
    ],
    afterFiles: [
      // when proxying /docs, the old dashboard contacts posthog via /ingest. thus we need to proxy /ingest as well
      {
        source: "/ingest/:path*",
        destination: "https://app.posthog.com/:path*",
      },
    ],
  }),
};

export default withMDX(config);
