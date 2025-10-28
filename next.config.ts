import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/:slug-jodi-chart",
        destination: "/jodi-chart/:slug",
      },
      {
        source: "/:slug-panel-chart",
        destination: "/panel-chart/:slug",
      },
      // Handle uppercase variants
      {
        source: "/:SLUG-JODI-CHART",
        destination: "/jodi-chart/:SLUG",
      },
      {
        source: "/:SLUG-PANEL-CHART",
        destination: "/panel-chart/:SLUG",
      },
    ];
  },
  eslint: {
    // Do not block production builds on ESLint errors. We'll address lint issues separately.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
