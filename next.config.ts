import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Allow phone / LAN testing of the Turbopack/HMR asset pipeline
  allowedDevOrigins: ["192.168.8.247"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "evento-cdn.efindly.gr",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
