import { prisma } from './db'
import { ActivityData, ActivityType, EmissionFactor, ACTIVITY_SCOPE_MAP } from './types'
import { DEFAULT_EMISSION_FACTORS, buildActivityData } from './seed-data'

// ─────────────────────────────────────────
// DB 초기화 (시드 데이터)
// ─────────────────────────────────────────

// DB가 비어있으면 과제 제공 기본 데이터를 자동으로 삽입
// 이유: 처음 실행할 때 대시보드가 바로 데이터를 보여줘야 함
export async function seedIfEmpty() {
  const count = await prisma.emissionFactor.count()
  if (count > 0) return // 이미 데이터가 있으면 건너뜀

  // 배출계수 시드
  for (const ef of DEFAULT_EMISSION_FACTORS) {
    await prisma.emissionFactor.create({
      data: {
        id: ef.id,
        category: ef.category,
        subCategory: ef.subCategory,
        factor: ef.factor,
        unit: ef.unit,
        source: ef.source,
        version: ef.version,
        isActive: ef.isActive,
        validFrom: ef.validFrom,
        validUntil: ef.validUntil,
      },
    })
  }

  // 활동 데이터 시드
  const activityData = buildActivityData(DEFAULT_EMISSION_FACTORS)
  for (const ad of activityData) {
    await prisma.activityData.create({
      data: {
        id: ad.id,
        date: ad.date,
        activityType: ad.activityType,
        description: ad.description,
        quantity: ad.quantity,
        unit: ad.unit,
        scope: ad.scope,
        emissionFactor: ad.emissionFactor,
        emissionFactorId: ad.emissionFactorId,
        calculatedCO2e: ad.calculatedCO2e,
      },
    })
  }
}

// ─────────────────────────────────────────
// 배출계수 관련 함수
// ─────────────────────────────────────────

// 전체 배출계수 조회 (활성 + 비활성 이력 모두 포함)
export async function getEmissionFactors(): Promise<EmissionFactor[]> {
  const factors = await prisma.emissionFactor.findMany({
    orderBy: [{ category: 'asc' }, { version: 'desc' }],
  })
  return factors as EmissionFactor[]
}

// 특정 활동 유형 + 세부 항목의 현재 활성 배출계수 조회
export async function getActiveEmissionFactor(
  category: ActivityType,
  subCategory: string
): Promise<EmissionFactor | undefined> {
  const factor = await prisma.emissionFactor.findFirst({
    where: { category, subCategory, isActive: true },
  })
  return factor as EmissionFactor | undefined
}

// 새 배출계수 등록
// 기존 같은 항목은 isActive=false로 비활성화 (이력 보존)
export async function addEmissionFactor(
  data: Omit<EmissionFactor, 'id' | 'version' | 'createdAt'>
): Promise<EmissionFactor> {
  // 기존 활성 계수 개수 확인 (버전 번호 계산용)
  const existingCount = await prisma.emissionFactor.count({
    where: { category: data.category, subCategory: data.subCategory },
  })

  // 기존 활성 계수 비활성화
  await prisma.emissionFactor.updateMany({
    where: { category: data.category, subCategory: data.subCategory, isActive: true },
    data: { isActive: false, validUntil: new Date() },
  })

  // 새 버전 생성
  const newFactor = await prisma.emissionFactor.create({
    data: {
      category: data.category,
      subCategory: data.subCategory,
      factor: data.factor,
      unit: data.unit,
      source: data.source,
      version: existingCount + 1,
      isActive: true,
      validFrom: data.validFrom,
      validUntil: null,
    },
  })

  return newFactor as EmissionFactor
}

// ─────────────────────────────────────────
// 활동 데이터 관련 함수
// ─────────────────────────────────────────

// 전체 활동 데이터 조회 (날짜 오름차순)
export async function getActivityData(): Promise<ActivityData[]> {
  const data = await prisma.activityData.findMany({
    orderBy: { date: 'asc' },
  })
  return data as ActivityData[]
}

// 새 활동 데이터 추가
// 저장 시점의 배출계수를 스냅샷으로 저장
export async function addActivityData(
  rows: Array<{
    date: Date
    activityType: ActivityType
    description: string
    quantity: number
    unit: string
  }>
): Promise<ActivityData[]> {
  const added: ActivityData[] = []

  for (const row of rows) {
    // 현재 활성 배출계수 조회
    const ef = await getActiveEmissionFactor(row.activityType, row.description)

    const newRecord = await prisma.activityData.create({
      data: {
        date: row.date,
        activityType: row.activityType,
        description: row.description,
        quantity: row.quantity,
        unit: row.unit,
        scope: ACTIVITY_SCOPE_MAP[row.activityType],
        emissionFactor: ef?.factor ?? null,
        emissionFactorId: ef?.id ?? null,
        calculatedCO2e: ef ? row.quantity * ef.factor : null,
      },
    })

    added.push(newRecord as ActivityData)
  }

  return added
}

// 활동 데이터 삭제
export async function deleteActivityData(id: string): Promise<boolean> {
  try {
    await prisma.activityData.delete({ where: { id } })
    return true
  } catch {
    return false
  }
}