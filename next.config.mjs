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
  },
};

export default withMDX(config);
