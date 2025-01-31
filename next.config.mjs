import { createMDX } from "fumadocs-mdx/next";

const LANDING_PAGE_DOMAIN = "e2b-landing-page.com";
const LANDING_PAGE_FRAMER_DOMAIN = "e2b-landing-page.framer.website";
const BLOG_FRAMER_DOMAIN = "e2b-blog.framer.website";
const DOCS_NEXT_DOMAIN = "docs.e2b.dev";

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
  rewrites: async () => {
    return {
      beforeFiles: [
        // Landing page rewrites
        {
          source: "/",
          destination: `https://${LANDING_PAGE_DOMAIN}`,
          basePath: false,
        },
        {
          source: "/terms/:path*",
          destination: `https://${LANDING_PAGE_DOMAIN}/terms/:path*`,
          basePath: false,
        },
        {
          source: "/privacy/:path*",
          destination: `https://${LANDING_PAGE_DOMAIN}/privacy/:path*`,
          basePath: false,
        },
        {
          source: "/pricing/:path*",
          destination: `https://${LANDING_PAGE_DOMAIN}/pricing/:path*`,
          basePath: false,
        },
        {
          source: "/cookbook/:path*",
          destination: `https://${LANDING_PAGE_DOMAIN}/cookbook/:path*`,
          basePath: false,
        },
        {
          source: "/changelog/:path*",
          destination: `https://${LANDING_PAGE_DOMAIN}/changelog/:path*`,
          basePath: false,
        },
        // Framer landing page rewrites
        {
          source: "/ai-agents/:path*",
          destination: `https://${LANDING_PAGE_FRAMER_DOMAIN}/ai-agents/:path*`,
          basePath: false,
        },
        // Blog rewrites
        {
          source: "/blog",
          destination: `https://${BLOG_FRAMER_DOMAIN}`,
          basePath: false,
        },
        {
          source: "/blog/:path*",
          destination: `https://${BLOG_FRAMER_DOMAIN}/blog/:path*`,
          basePath: false,
        },
        // Docs rewrites
        {
          source: "/docs/:path*",
          destination: `https://${DOCS_NEXT_DOMAIN}/docs/:path*`,
          basePath: false,
        },
      ],
    };
  },
};

export default withMDX(config);
