import type { NextConfig } from "next";

const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
} satisfies NextConfig;

export default nextConfig;

