import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// globalThis에 Prisma Client를 저장하기 위한 타입 선언
// Next.js 개발 모드 핫리로드 시 커넥션이 중복 생성되는 것을 방지
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // pg Pool로 커넥션 풀 생성
  // Prisma v7부터는 어댑터 패턴으로 DB 연결
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  })

  const adapter = new PrismaPg(pool)

  return new PrismaClient({
    adapter,
    // 개발 환경에서만 쿼리 로그 출력
    // 운영 환경에서는 에러만 로깅
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  })
}

// 싱글톤 패턴
// globalThis에 인스턴스가 있으면 재사용, 없으면 새로 생성
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// 개발 환경에서만 globalThis에 저장
// 운영 환경에서는 매번 새로 생성 (서버리스 환경 고려)
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}