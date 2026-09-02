import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "pickopick.com", pathname: "/PICKLogo.png" },
    ],
  },
};

export default nextConfig;
