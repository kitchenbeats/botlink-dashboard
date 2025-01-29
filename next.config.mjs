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
    turbo: true,
    staleTimes: {
      dynamic: 180,
      static: 180,
    },
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  rewrites: async () => {
    return [
      {
        source: "/",
        destination: "https://e2b.dev",
      },
    ];
  },
};

export default withMDX(config);
