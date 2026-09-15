import type { NextConfig } from 'next';
import { getAllowedDevOrigins } from './lib/lan-dev-origins';

const apiBaseUrl = process.env.PHARMA_API_BASE_URL ?? 'http://localhost:4000';
const devDistDir =
  process.env.PHARMA_NEXT_DIST_DIR ?? `.next-web-dev-${process.pid}`;
const distDir =
  process.env.PHARMA_NEXT_DIST_DIR ??
  (process.env.NODE_ENV === 'development' ? devDistDir : '.next-prod');

const isProduction = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  // LAN dev only — skip on VPS production build
  ...(isProduction
    ? {}
    : { allowedDevOrigins: getAllowedDevOrigins(process.env.PORT ?? '3000') }),
  distDir,
  cleanDistDir: false,
  serverExternalPackages: ['xlsx', '@prisma/client', 'tesseract.js'],
  experimental: {
    cpus: 1,
    mcpServer: false,
    workerThreads: true,
    webpackBuildWorker: false,
  },
  async rewrites() {
    return [
      {
        source: '/backend-api/:path*',
        destination: `${apiBaseUrl}/api/:path*`,
      },
      {
        source: '/backend-health/:path*',
        destination: `${apiBaseUrl}/health/:path*`,
      },
    ];
  },
};

export default nextConfig;
