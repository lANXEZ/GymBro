import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'development' 
          ? 'http://localhost:3000/api/:path*'
          : 'https://gb-backend-phi.vercel.app/api/:path*', // Proxy to Backend
      },
    ]
  }
};

export default nextConfig;
