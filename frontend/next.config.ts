import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(currentDir, ".."),
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
        source: "/api/furniture",
        destination: `${backendUrl}/api/furniture`,
      },
      {
        source: "/api/v1/ikea-catalog",
        destination: `${backendUrl}/api/v1/ikea-catalog`,
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
        source: "/api/v1/chat",
        destination: `${backendUrl}/api/v1/chat`,
      },
      {
        source: "/api/v1/db-check",
        destination: `${backendUrl}/api/v1/db-check`,
      },
      {
        source: "/api/v1/studio/:path*",
        destination: `${backendUrl}/api/v1/studio/:path*`,
      },
      {
        source: "/api/v1/spatial-audit",
        destination: `${backendUrl}/api/v1/spatial-audit`,
      },
      {
        source: "/api/v1/architectural-standards",
        destination: `${backendUrl}/api/v1/architectural-standards`,
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
    const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const corsHeaders = [
      ...(allowedOrigin !== "*" ? [{ key: "Access-Control-Allow-Credentials", value: "true" }] : []),
      { key: "Access-Control-Allow-Origin", value: allowedOrigin },
      { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
      { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
    ];

    return [
      {
        source: "/:path*",
        headers: corsHeaders,
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
