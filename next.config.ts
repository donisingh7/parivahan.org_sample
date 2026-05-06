import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit", "sharp", "qrcode", "moment"],

  // The /api/receipt/[transactionId] route spawns receipt-runner.js as a
  // child process, which then loads generateReceipt.js, the Roboto fonts and
  // the Rajasthan watermark from disk. Those files are referenced via
  // runtime-computed paths (path.join with __dirname / process.cwd()), which
  // @vercel/nft cannot statically analyse — so on Vercel they get dropped
  // from the function bundle and the runtime hits MODULE_NOT_FOUND.
  // Listing them here forces nft to copy them into /var/task/.
  outputFileTracingIncludes: {
    "/api/receipt/**": [
      "receipt-generator/**/*",
      "public/Images/Rajasthan-Transport-Department.png",
      "node_modules/pdfkit/**",
      "node_modules/qrcode/**",
      "node_modules/sharp/**",
      "node_modules/moment/**",
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
