import { ActivityData, ActivityType, EmissionFactor, ACTIVITY_SCOPE_MAP } from './types'
import { DEFAULT_EMISSION_FACTORS, buildActivityData } from './seed-data'

// ─────────────────────────────────────────
// 글로벌 스토어 타입 정의
// ─────────────────────────────────────────

// globalThis에 붙일 스토어 구조 정의
// Next.js 개발 모드에서 핫리로드 시 일반 변수는 초기화되지만
// globalThis에 저장된 값은 유지됨
const globalStore = globalThis as unknown as {
  _emissionFactors: EmissionFactor[]  // 배출계수 목록 (이력 포함)
  _activityData: ActivityData[]       // 활동 데이터 목록
  _storeInitialized: boolean          // 최초 1회만 초기화하기 위한 플래그
}

// ─────────────────────────────────────────
// 초기화
// ─────────────────────────────────────────

// 최초 1회만 실행 — 이후 핫리로드가 일어나도 이 블록은 건너뜀
function initStore() {
  if (!globalStore._storeInitialized) {
    // 배출계수 초기값: 과제 제공 기본값 (KEPCO, IPCC 등)
    globalStore._emissionFactors = [...DEFAULT_EMISSION_FACTORS]
    // 활동 데이터 초기값: 과제 제공 원본 데이터 (배출계수 적용해서 CO2e 계산 완료)
    globalStore._activityData = buildActivityData(globalStore._emissionFactors)
    globalStore._storeInitialized = true
  }
}

// ─────────────────────────────────────────
// 배출계수 관련 함수
// ─────────────────────────────────────────

// 전체 배출계수 조회 (비활성 이력 포함)
export function getEmissionFactors(): EmissionFactor[] {
  initStore()
  return globalStore._emissionFactors
}

// 특정 활동 유형 + 세부 항목의 현재 활성 배출계수 조회
// 예: getActiveEmissionFactor('electricity', '한국전력') → { factor: 0.456, ... }
export function getActiveEmissionFactor(
  category: ActivityType,
  subCategory: string
): EmissionFactor | undefined {
  initStore()
  return globalStore._emissionFactors.find(
    (f) => f.category === category && f.subCategory === subCategory && f.isActive
  )
}

// 새 배출계수 등록
// 핵심 로직: 기존 같은 항목이 있으면 비활성화(이력 보존) 후 새 버전 추가
// 삭제하지 않는 이유: 과거 데이터가 어떤 계수로 계산됐는지 감사(audit) 추적 가능해야 함
export function addEmissionFactor(
  data: Omit<EmissionFactor, 'id' | 'version' | 'createdAt'>
): EmissionFactor {
  initStore()

  // 같은 카테고리 + 세부항목의 기존 계수들 찾기
  const existing = globalStore._emissionFactors.filter(
    (f) => f.category === data.category && f.subCategory === data.subCategory
  )

  // 기존 활성 계수 비활성화 (삭제 X — 이력 보존)
  existing.forEach((f) => {
    f.isActive = false
    f.validUntil = new Date() // 오늘부터 이 버전은 만료
  })

  // 새 버전 생성 (버전 번호는 기존 개수 + 1)
  const newFactor: EmissionFactor = {
    ...data,
    id: `ef-${Date.now()}`,
    version: existing.length + 1,
    createdAt: new Date(),
  }

  globalStore._emissionFactors.push(newFactor)
  return newFactor
}

// ─────────────────────────────────────────
// 활동 데이터 관련 함수
// ─────────────────────────────────────────

// 전체 활동 데이터 조회 (날짜 오름차순 정렬)
export function getActivityData(): ActivityData[] {
  initStore()
  return [...globalStore._activityData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
}

// 새 활동 데이터 추가
// 저장 시점의 배출계수를 스냅샷으로 저장하는 이유:
//   나중에 배출계수가 바뀌어도 당시 계산값은 변하지 않아야 함
//   (회계 감사 원칙: 과거 기록 불변)
export function addActivityData(
  rows: Array<{
    date: Date
    activityType: ActivityType
    description: string
    quantity: number
    unit: string
  }>
): ActivityData[] {
  initStore()

  const added: ActivityData[] = []

  for (const row of rows) {
    // 현재 활성 배출계수 찾기
    const ef = getActiveEmissionFactor(row.activityType, row.description)

    const newRecord: ActivityData = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: row.date,
      activityType: row.activityType,
      description: row.description,
      quantity: row.quantity,
      unit: row.unit,
      scope: ACTIVITY_SCOPE_MAP[row.activityType], // Scope 자동 분류
      emissionFactor: ef?.factor ?? null,           // 배출계수 스냅샷
      emissionFactorId: ef?.id ?? null,             // 어떤 계수를 썼는지 참조
      calculatedCO2e: ef ? row.quantity * ef.factor : null, // CO2e 자동 계산
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    globalStore._activityData.push(newRecord)
    added.push(newRecord)
  }

  return added
}

// 활동 데이터 삭제
// 반환값: 삭제 성공 여부
export function deleteActivityData(id: string): boolean {
  initStore()
  const before = globalStore._activityData.length
  globalStore._activityData = globalStore._activityData.filter((d) => d.id !== id)
  return globalStore._activityData.length < before
}

// 스토어 완전 초기화 (테스트 또는 리셋 기능용)
export function resetStore() {
  globalStore._emissionFactors = [...DEFAULT_EMISSION_FACTORS]
  globalStore._activityData = buildActivityData(globalStore._emissionFactors)
}