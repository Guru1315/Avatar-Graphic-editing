import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the project root: a stray package-lock.json in a parent folder
  // (C:\Users\ADMIN) otherwise makes Next.js treat that folder as the root.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
