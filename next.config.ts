import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Everything on this site is client-side mocked; no external image domains needed.
  // Next 16 dropped the built-in `eslint` config key — linting runs standalone via `npm run lint`.
  // Static export for GitHub Pages (served at the user-site root, so no basePath/assetPrefix).
  output: "export",
  trailingSlash: true,
};

export default nextConfig;
