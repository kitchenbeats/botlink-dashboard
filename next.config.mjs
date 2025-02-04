import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: false,
  experimental: {
    reactCompiler: true,
    reactOwnerStack: true,
    ppr: true,
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
  // we redirect here for backward compatibility, because route location changed between old and new dashboard
  redirects: async () => [
    {
      source: "/docs/api/cli",
      destination: "/auth/cli",
      permanent: true,
    },
  ],
  /*  rewrites: async () => ({
    fallback: [
      {
        source: "/docs/:path*",
        destination: `https://e2b-web-git-remove-dashboard-auth-parts-to-only-host-5e727c-e2b.vercel.app/docs/:path*`,
      },
    ],
  }), */
};

export default withMDX(config);
