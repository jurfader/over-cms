import type { NextConfig } from 'next'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function readVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf-8'))
    return pkg.version ?? '0.0.0'
  } catch { return '0.0.0' }
}

const nextConfig: NextConfig = {
  output: 'standalone',
  basePath: '/admin',
  env: {
    APP_VERSION: readVersion(),
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '9000' },
      { protocol: 'http', hostname: 'localhost', port: '3001' },
    ],
  },
}

export default nextConfig
