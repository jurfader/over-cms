import type { NextConfig } from 'next'

const config: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname:  'localhost',
        port:      '3000',
        pathname:  '/uploads/**',
      },
      {
        protocol: 'https',
        hostname:  '**',
        pathname:  '/uploads/**',
      },
    ],
  },
}

export default config
