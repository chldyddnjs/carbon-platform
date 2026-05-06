import { ActivityData, ActivityType, EmissionFactor, ACTIVITY_SCOPE_MAP } from './types'

// 과제 제공 기본 배출계수
// 이 값들은 실제 공식 출처 기반:
// - 전기: 한국전력공사(KEPCO) 2024
// - 원소재: IPCC 2023 / ecoinvent 3.9
// - 운송: 환경부 국가 온실가스 인벤토리 2024
export const DEFAULT_EMISSION_FACTORS: EmissionFactor[] = [
  {
    id: 'ef-001',
    category: 'electricity',
    subCategory: '한국전력',
    factor: 0.456,
    unit: 'kWh',
    source: '한국전력공사 (KEPCO) 2024',
    version: 1,
    isActive: true,
    validFrom: new Date('2025-01-01'),
    validUntil: null,
    createdAt: new Date('2025-01-01'),
  },
  {
    id: 'ef-002',
    category: 'raw_material',
    subCategory: '플라스틱 1',
    factor: 2.3,
    unit: 'kg',
    source: 'IPCC 2023 / ecoinvent 3.9',
    version: 1,
    isActive: true,
    validFrom: new Date('2025-01-01'),
    validUntil: null,
    createdAt: new Date('2025-01-01'),
  },
  {
    id: 'ef-003',
    category: 'raw_material',
    subCategory: '플라스틱 2',
    factor: 3.2,
    unit: 'kg',
    source: 'IPCC 2023 / ecoinvent 3.9',
    version: 1,
    isActive: true,
    validFrom: new Date('2025-01-01'),
    validUntil: null,
    createdAt: new Date('2025-01-01'),
  },
  {
    id: 'ef-004',
    category: 'transport',
    subCategory: '트럭',
    factor: 3.5,
    unit: 'ton-km',
    source: '환경부 국가 온실가스 인벤토리 2024',
    version: 1,
    isActive: true,
    validFrom: new Date('2025-01-01'),
    validUntil: null,
    createdAt: new Date('2025-01-01'),
  },
]

// 과제 제공 원본 활동 데이터 (CT-045 사업장)
const RAW_DATA: Array<{
  date: string
  type: ActivityType
  description: string
  quantity: number
  unit: string
}> = [
  // 전기
  { date: '2025-01-01', type: 'electricity', description: '한국전력', quantity: 110, unit: 'kWh' },
  { date: '2025-02-01', type: 'electricity', description: '한국전력', quantity: 112, unit: 'kWh' },
  { date: '2025-03-01', type: 'electricity', description: '한국전력', quantity: 115, unit: 'kWh' },
  { date: '2025-04-01', type: 'electricity', description: '한국전력', quantity: 130, unit: 'kWh' },
  { date: '2025-05-01', type: 'electricity', description: '한국전력', quantity: 120, unit: 'kWh' },
  { date: '2025-06-01', type: 'electricity', description: '한국전력', quantity: 110, unit: 'kWh' },
  { date: '2025-07-01', type: 'electricity', description: '한국전력', quantity: 120, unit: 'kWh' },
  { date: '2025-08-01', type: 'electricity', description: '한국전력', quantity: 111, unit: 'kWh' },
  { date: '2025-05-01', type: 'electricity', description: '한국전력', quantity: 101, unit: 'kWh' },
  // 원소재
  { date: '2025-01-01', type: 'raw_material', description: '플라스틱 1', quantity: 230, unit: 'kg' },
  { date: '2025-02-01', type: 'raw_material', description: '플라스틱 1', quantity: 340, unit: 'kg' },
  { date: '2025-03-01', type: 'raw_material', description: '플라스틱 2', quantity: 23, unit: 'kg' },
  { date: '2025-03-01', type: 'raw_material', description: '플라스틱 1', quantity: 430, unit: 'kg' },
  { date: '2025-04-01', type: 'raw_material', description: '플라스틱 1', quantity: 510, unit: 'kg' },
  { date: '2025-05-01', type: 'raw_material', description: '플라스틱 1', quantity: 424, unit: 'kg' },
  { date: '2025-05-01', type: 'raw_material', description: '플라스틱 2', quantity: 40, unit: 'kg' },
  { date: '2025-06-01', type: 'raw_material', description: '플라스틱 1', quantity: 450, unit: 'kg' },
  { date: '2025-07-01', type: 'raw_material', description: '플라스틱 1', quantity: 340, unit: 'kg' },
  { date: '2025-07-01', type: 'raw_material', description: '플라스틱 2', quantity: 43, unit: 'kg' },
  { date: '2025-08-01', type: 'raw_material', description: '플라스틱 1', quantity: 230, unit: 'kg' },
  { date: '2025-05-01', type: 'raw_material', description: '플라스틱 1', quantity: 232, unit: 'kg' },
  // 운송
  { date: '2025-01-01', type: 'transport', description: '트럭', quantity: 41,  unit: 'ton-km' },
  { date: '2025-02-01', type: 'transport', description: '트럭', quantity: 211, unit: 'ton-km' },
  { date: '2025-03-01', type: 'transport', description: '트럭', quantity: 123, unit: 'ton-km' },
  { date: '2025-04-01', type: 'transport', description: '트럭', quantity: 42,  unit: 'ton-km' },
  { date: '2025-05-01', type: 'transport', description: '트럭', quantity: 123, unit: 'ton-km' },
  { date: '2025-06-01', type: 'transport', description: '트럭', quantity: 123, unit: 'ton-km' },
  { date: '2025-07-01', type: 'transport', description: '트럭', quantity: 41,  unit: 'ton-km' },
  { date: '2025-08-01', type: 'transport', description: '트럭', quantity: 123, unit: 'ton-km' },
  { date: '2025-05-01', type: 'transport', description: '트럭', quantity: 12,  unit: 'ton-km' },
]

function findEmissionFactor(
  type: ActivityType,
  description: string,
  factors: EmissionFactor[]
): EmissionFactor | undefined {
  return factors.find(
    (f) => f.category === type && f.subCategory === description && f.isActive
  )
}

// RAW_DATA를 ActivityData 형태로 변환
// 배출계수를 찾아서 calculatedCO2e 자동 계산
export function buildActivityData(
  factors: EmissionFactor[] = DEFAULT_EMISSION_FACTORS
): ActivityData[] {
  return RAW_DATA.map((row, idx) => {
    const ef = findEmissionFactor(row.type, row.description, factors)
    return {
      id: `act-${String(idx + 1).padStart(3, '0')}`,
      date: new Date(row.date),
      activityType: row.type,
      description: row.description,
      quantity: row.quantity,
      unit: row.unit,
      scope: ACTIVITY_SCOPE_MAP[row.type],
      emissionFactor: ef?.factor ?? null,
      emissionFactorId: ef?.id ?? null,
      calculatedCO2e: ef ? row.quantity * ef.factor : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  })
}

export const SEED_ACTIVITY_DATA = buildActivityData()