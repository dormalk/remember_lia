import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Vercel Blob serves public content images at https://<storeId>.public.blob.vercel-storage.com/<pathname>
    // — `next/image` rejects remote URLs whose host isn't explicitly allow-listed.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
