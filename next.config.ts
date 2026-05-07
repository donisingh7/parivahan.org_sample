import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit", "sharp", "qrcode", "moment"],

  // generateReceiptRajasthan.js is required via a static relative path in
  // route.ts, so webpack bundles it and nft automatically traces pdfkit /
  // sharp / qrcode / moment (and all their transitive deps) into the Vercel
  // function bundle.
  // Only the binary assets accessed via process.cwd() at runtime need to be
  // listed here — nft cannot trace fs reads from runtime-computed paths.
  outputFileTracingIncludes: {
    "/api/receipt/**": [
      "receipt-generator/fonts/**",
      "public/Images/Rajasthan-Transport-Department.png",
    ],
  },

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
