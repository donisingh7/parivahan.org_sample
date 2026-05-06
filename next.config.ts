import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit", "sharp", "qrcode", "moment"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "parivahan.gov.in",
      },
    ],
  },
};

export default nextConfig;
