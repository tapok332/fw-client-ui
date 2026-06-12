import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    minimumCacheTTL: 0,
    deviceSizes: [640, 960, 1280, 1920],
    imageSizes: [64, 128, 256],
    formats: ['image/webp'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {protocol: 'https', hostname: 'picsum.photos', pathname: '/**'},
      {protocol: 'https', hostname: '**.picsum.photos'},
      {protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**'},
      {protocol: 'https', hostname: 'storage.googleapis.com'},
      {protocol: 'https', hostname: 'via.placeholder.com'},
      {protocol: 'https', hostname: 'example.com', pathname: '/images/**'},
    ],
  },
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
