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
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Enable production source maps for better debugging
  productionBrowserSourceMaps: false,
  
  // Optimize images
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Configure compiler options for smaller bundles
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
    // Enable React server components
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },
  
  // Enable gzip compression
  compress: true,
  
  // Configure webpack for bundle optimization
  webpack: (config, { dev, isServer }) => {
    // Only run bundle analyzer in build mode
    if (!dev && !isServer) {
      // You can uncomment this to analyze bundle size
      // const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      // config.plugins.push(
      //   new BundleAnalyzerPlugin({
      //     analyzerMode: 'static',
      //     reportFilename: './analyze/client.html',
      //     openAnalyzer: false,
      //   })
      // );
    }
    
    return config;
  },
};

module.exports = nextConfig;