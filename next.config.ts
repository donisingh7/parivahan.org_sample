import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @aws-sdk/client-s3 is in Next.js' built-in opt-out list; @aws-sdk/client-sns
  // is not, so we add it here to keep both AWS SDK clients on native Node
  // require and avoid bundler-induced runtime issues.
  serverExternalPackages: [
    "pdfkit",
    "sharp",
    "qrcode",
    "moment",
    "@aws-sdk/client-sns",
  ],

  // Per-state generateReceipt.js files are required via static relative paths
  // in src/lib/states/registry.server.ts so webpack bundles every state's
  // generator and nft automatically traces pdfkit / sharp / qrcode / moment
  // (and all transitive deps) into each function bundle.
  //
  // Only the binary assets accessed via process.cwd() at runtime need to be
  // listed here — nft cannot trace fs reads from runtime-computed paths.
  // Today every state reuses the Rajasthan watermark image as a placeholder;
  // when state-specific assets are dropped into public/Images/ they should
  // be added to this list.
  outputFileTracingIncludes: {
    "/api/receipt/**": [
      "receipt-generator/fonts/**",
      "public/Images/Rajasthan-Transport-Department.png",
    ],
    "/api/payment/**": [
      "receipt-generator/fonts/**",
      "public/Images/Rajasthan-Transport-Department.png",
    ],
    "/api/r/**": [
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
