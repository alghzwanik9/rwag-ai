import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: "../",
  },
  async rewrites() {
    // Determine backend URL based on environment (Vercel uses NEXT_PUBLIC_API_URL)
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    
    return [
      {
        source: "/api/generate-room",
        destination: `${backendUrl}/api/generate-room`,
      },
      {
        source: "/api/recommendations/:path*",
        destination: `${backendUrl}/api/recommendations/:path*`,
      },
      {
        source: "/api/v1/assets",
        destination: `${backendUrl}/api/v1/assets`,
      },
      {
        source: "/api/v1/assets/:path*",
        destination: `${backendUrl}/api/v1/assets/:path*`,
      },
      {
        source: "/api/v1/projects/:path*",
        destination: `${backendUrl}/api/v1/projects/:path*`,
      },
      {
        source: "/api/server-ip",
        destination: `${backendUrl}/api/server-ip`,
      },
      {
        source: "/outputs/:path*",
        destination: `${backendUrl}/outputs/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
