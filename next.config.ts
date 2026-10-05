import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin Turbopack's workspace root: a stray package-lock.json in the user
  // home directory otherwise makes Next pick the wrong root and routes 404.
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "pickopick.com", pathname: "/PICKLogo.webp" },
    ],
  },
};

export default nextConfig;
