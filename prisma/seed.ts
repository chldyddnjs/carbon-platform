import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// 과제 제공 기본 배출계수
const DEFAULT_EMISSION_FACTORS = [
  {
    category:    'electricity',
    subCategory: '한국전력',
    factor:      0.456,
    unit:        'kWh',
    source:      '한국전력공사 (KEPCO) 2024',
    version:     1,
    isActive:    true,
    validFrom:   new Date('2025-01-01'),
    validUntil:  null,
  },
  {
    category:    'raw_material',
    subCategory: '플라스틱 1',
    factor:      2.3,
    unit:        'kg',
    source:      'IPCC 2023 / ecoinvent 3.9',
    version:     1,
    isActive:    true,
    validFrom:   new Date('2025-01-01'),
    validUntil:  null,
  },
  {
    category:    'raw_material',
    subCategory: '플라스틱 2',
    factor:      3.2,
    unit:        'kg',
    source:      'IPCC 2023 / ecoinvent 3.9',
    version:     1,
    isActive:    true,
    validFrom:   new Date('2025-01-01'),
    validUntil:  null,
  },
  {
    category:    'transport',
    subCategory: '트럭',
    factor:      3.5,
    unit:        'ton-km',
    source:      '환경부 국가 온실가스 인벤토리 2024',
    version:     1,
    isActive:    true,
    validFrom:   new Date('2025-01-01'),
    validUntil:  null,
  },
]

async function main() {
  console.log('🌱 시드 데이터 삽입 시작...')

  // 이미 배출계수가 있으면 건너뜀
  const count = await prisma.emissionFactor.count()
  if (count > 0) {
    console.log(`✓ 배출계수가 이미 ${count}개 존재합니다. 건너뜁니다.`)
    return
  }

  for (const ef of DEFAULT_EMISSION_FACTORS) {
    await prisma.emissionFactor.create({ data: ef })
    console.log(`✓ ${ef.category} - ${ef.subCategory} (${ef.factor} kgCO₂e/${ef.unit})`)
  }

  console.log('✅ 시드 데이터 삽입 완료!')
}

main()
  .catch((e) => {
    console.error('❌ 시드 오류:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })