/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/:path*`,
      },
    ];
  },
  
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Disable source maps in production for smaller bundles
  productionBrowserSourceMaps: false,
  
  // Optimize images
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  
  // Configure compiler options for smaller bundles
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
    // Enable React server components optimizations
    reactRemoveProperties: process.env.NODE_ENV === 'production',
    // Enable SWC minification
    styledComponents: true,
  },
  
  // Enable gzip compression
  compress: true,
  
  // Experimental features for performance
  experimental: {
    // Enable modern JavaScript output
    esmExternals: true,
    // Enable concurrent features
    serverComponentsExternalPackages: ['mysql2'],
  },
  
  // Configure webpack for bundle optimization
  webpack: (config, { dev, isServer, webpack }) => {
    // Only apply optimizations to client-side builds
    if (!dev && !isServer) {
      // Enable tree shaking
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }
    
    // Optimize module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };
    
    return config;
  },
  
  // Headers for caching and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;