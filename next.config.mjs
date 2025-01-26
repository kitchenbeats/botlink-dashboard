import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  experimental: {
    reactCompiler: true,
    reactOwnerStack: true,
    ppr: "incremental",
  },
  async rewrites() {
    return [
      {
        source: "/",
        destination: "https://e2b.dev",
      },
    ];
  },
};

export default withMDX(config);
