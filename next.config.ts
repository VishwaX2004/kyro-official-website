import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase storage — user uploads and product images
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Unsplash — seeded product placeholder images
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      // Unsplash CDN (plus.unsplash.com, source.unsplash.com)
      {
        protocol: "https",
        hostname: "*.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
