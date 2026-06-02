import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers: async () => [
    {
      // AASA — no cache so iOS always fetches the latest appID
      source: "/.well-known/apple-app-site-association",
      headers: [
        { key: "Content-Type", value: "application/json" },
        { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
      ],
    },
    {
      // Deeplink redirect page — no cache, allow navigation to custom schemes
      source: "/chatgpt",
      headers: [
        { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
        // Allow window.location.href to navigate to com.dev.shopopop:// and com.shopopop.com://
        { key: "Content-Security-Policy", value: "navigate-to *;" },
      ],
    },
  ],
};

export default nextConfig;
