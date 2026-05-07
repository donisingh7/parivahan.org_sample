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

  // generateReceiptRajasthan.js is required via a static relative path in
  // both /api/receipt/[transactionId]/route.ts and /api/payment/route.ts (the
  // payment route now also renders the PDF before uploading it to S3), so
  // webpack bundles it for both routes and nft automatically traces pdfkit /
  // sharp / qrcode / moment into each function bundle.
  // Only the binary assets accessed via process.cwd() at runtime need to be
  // listed here — nft cannot trace fs reads from runtime-computed paths.
  outputFileTracingIncludes: {
    "/api/receipt/**": [
      "receipt-generator/fonts/**",
      "public/Images/Rajasthan-Transport-Department.png",
    ],
    "/api/payment/**": [
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
