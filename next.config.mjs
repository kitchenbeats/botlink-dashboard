import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: false,
  experimental: {
    reactCompiler: true,
    reactOwnerStack: true,
    ppr: "incremental",
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
};

export default withMDX(config);
