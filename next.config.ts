import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // pg, prisma 등 Node.js 전용 모듈을 서버에서만 번들링
  serverExternalPackages: ['pg', '@prisma/client', '@prisma/adapter-pg'],
}

export default nextConfig