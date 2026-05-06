import { ActivityData, GHGScope, MonthlyEmission,DailyEmission,WeeklyEmission,YearlyEmission, ScopeBreakdown, ActivitySummary, ActivityType } from './types'
import { format, startOfMonth } from 'date-fns'

// ─────────────────────────────────────────
// 기본 계산 함수
// ─────────────────────────────────────────

// 전체 CO2e 합산
// calculatedCO2e가 null인 경우(배출계수 없음)는 0으로 처리
export function calculateTotalCO2e(data: ActivityData[]): number {
  return data.reduce((sum, d) => sum + (d.calculatedCO2e ?? 0), 0)
}

// 특정 Scope의 CO2e 합산
// 대시보드 KPI 카드에서 Scope별 수치 표시에 사용
export function calculateScopeCO2e(data: ActivityData[], scope: GHGScope): number {
  return data
    .filter((d) => d.scope === scope)
    .reduce((sum, d) => sum + (d.calculatedCO2e ?? 0), 0)
}

// ─────────────────────────────────────────
// 집계 함수 (차트/테이블용)
// ─────────────────────────────────────────

// 일별 배출량 집계
export function getDailyEmissions(data: ActivityData[]): DailyEmission[] {
  const dayMap = new Map<string, DailyEmission>()

  for (const row of data) {
    const d = row.date instanceof Date ? row.date : new Date(row.date)
    const day = format(d, 'yyyy-MM-dd')
    const co2e = row.calculatedCO2e ?? 0

    if (!dayMap.has(day)) {
      dayMap.set(day, {
        day,
        electricity: 0,
        rawMaterial: 0,
        transport: 0,
        total: 0,
        scope1: 0,
        scope2: 0,
        scope3: 0,
      })
    }

    const entry = dayMap.get(day)!

    entry.total += co2e
    if (row.activityType === 'electricity') entry.electricity += co2e
    else if (row.activityType === 'raw_material') entry.rawMaterial += co2e
    else if (row.activityType === 'transport') entry.transport += co2e

    if (row.scope === 1) entry.scope1 += co2e
    else if (row.scope === 2) entry.scope2 += co2e
    else if (row.scope === 3) entry.scope3 += co2e
  }

  return Array.from(dayMap.values()).sort((a, b) =>
    a.day.localeCompare(b.day)
  )
}

// 주별 배출량 집계
export function getWeeklyEmissions(data: ActivityData[]): WeeklyEmission[] {
  const weekMap = new Map<string, WeeklyEmission>()

  for (const row of data) {
    const d = row.date instanceof Date ? row.date : new Date(row.date)
    const week = format(d, 'yyyy-WW')
    const co2e = row.calculatedCO2e ?? 0

    if (!weekMap.has(week)) {
      weekMap.set(week, {
        week,
        electricity: 0,
        rawMaterial: 0,
        transport: 0,
        total: 0,
        scope1: 0,
        scope2: 0,
        scope3: 0,
      })
    }

    const entry = weekMap.get(week)!

    entry.total += co2e
    if (row.activityType === 'electricity') entry.electricity += co2e
    else if (row.activityType === 'raw_material') entry.rawMaterial += co2e
    else if (row.activityType === 'transport') entry.transport += co2e

    if (row.scope === 1) entry.scope1 += co2e
    else if (row.scope === 2) entry.scope2 += co2e
    else if (row.scope === 3) entry.scope3 += co2e
  }

  return Array.from(weekMap.values()).sort((a, b) =>
    a.week.localeCompare(b.week)
  )
}

// 월별 배출량 집계
// 활동 유형별(electricity/rawMaterial/transport)과
// Scope별(scope1/scope2/scope3)을 동시에 집계
// 이유: 차트에서 '활동 유형별 보기'와 'Scope별 보기' 두 모드를 지원하기 위해
export function getMonthlyEmissions(data: ActivityData[]): MonthlyEmission[] {
  // Map으로 월별로 그룹핑
  // key: '2025-01' 형식 문자열
  const monthMap = new Map<string, MonthlyEmission>()

  for (const row of data) {
    const d = row.date instanceof Date ? row.date : new Date(row.date)
    // date-fns로 월의 첫날로 정규화 후 'yyyy-MM' 형식으로 변환
    const month = format(startOfMonth(d), 'yyyy-MM')
    const co2e = row.calculatedCO2e ?? 0

    // 해당 월이 없으면 초기값 생성
    if (!monthMap.has(month)) {
      monthMap.set(month, {
        month,
        electricity: 0,
        rawMaterial: 0,
        transport: 0,
        total: 0,
        scope1: 0,
        scope2: 0,
        scope3: 0,
      })
    }

    const entry = monthMap.get(month)!

    // 활동 유형별 누적
    entry.total += co2e
    if (row.activityType === 'electricity') entry.electricity += co2e
    else if (row.activityType === 'raw_material') entry.rawMaterial += co2e
    else if (row.activityType === 'transport') entry.transport += co2e

    // Scope별 누적
    if (row.scope === 1) entry.scope1 += co2e
    else if (row.scope === 2) entry.scope2 += co2e
    else if (row.scope === 3) entry.scope3 += co2e
  }

  // 월 기준 오름차순 정렬 후 배열로 반환
  return Array.from(monthMap.values()).sort((a, b) =>
    a.month.localeCompare(b.month)
  )
}

//연도별 배출량 집계
export function getYearlyEmissions(data: ActivityData[]): YearlyEmission[] {
  const yearMap = new Map<string, YearlyEmission>()

  for (const row of data) {
    const d = row.date instanceof Date ? row.date : new Date(row.date)
    const year = format(d, 'yyyy')
    const co2e = row.calculatedCO2e ?? 0

    if (!yearMap.has(year)) {
      yearMap.set(year, {
        year,
        electricity: 0,
        rawMaterial: 0,
        transport: 0,
        total: 0,
        scope1: 0,
        scope2: 0,
        scope3: 0,
      })
    }

    const entry = yearMap.get(year)!

    entry.total += co2e
    if (row.activityType === 'electricity') entry.electricity += co2e
    else if (row.activityType === 'raw_material') entry.rawMaterial += co2e
    else if (row.activityType === 'transport') entry.transport += co2e

    if (row.scope === 1) entry.scope1 += co2e
    else if (row.scope === 2) entry.scope2 += co2e
    else if (row.scope === 3) entry.scope3 += co2e
  }

  return Array.from(yearMap.values()).sort((a, b) =>
    a.year.localeCompare(b.year)
  )
}

// Scope별 비중 계산 (도넛 차트용)
// percentage를 미리 계산해서 넣는 이유:
//   차트 컴포넌트는 받은 데이터를 그리기만 하면 됨
//   계산 로직이 컴포넌트 안에 들어가면 테스트하기 어려워짐
export function getScopeBreakdown(data: ActivityData[]): ScopeBreakdown[] {
  const total = calculateTotalCO2e(data)

  const scopeLabels: Record<GHGScope, string> = {
    1: 'Scope 1\n직접 배출',
    2: 'Scope 2\n간접(전력)',
    3: 'Scope 3\n기타 간접',
  }

  const scopeColors: Record<GHGScope, string> = {
    1: '#22c55e',
    2: '#3b82f6',
    3: '#f59e0b',
  }

  return ([1, 2, 3] as GHGScope[]).map((scope) => {
    const value = calculateScopeCO2e(data, scope)
    return {
      scope,
      label: scopeLabels[scope],
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
      color: scopeColors[scope],
    }
  })
}

// 활동 유형별 요약 (테이블용)
// 어떤 활동이 배출량에 가장 크게 기여하는지 한눈에 보여줌
export function getActivitySummary(data: ActivityData[]): ActivitySummary[] {
  const total = calculateTotalCO2e(data)

  const labels: Record<ActivityType, string> = {
    electricity: '전기',
    raw_material: '원소재',
    transport: '운송',
  }

  const units: Record<ActivityType, string> = {
    electricity: 'kWh',
    raw_material: 'kg',
    transport: 'ton-km',
  }

  return (['electricity', 'raw_material', 'transport'] as ActivityType[]).map((type) => {
    const rows = data.filter((d) => d.activityType === type)
    const totalCO2e = rows.reduce((s, d) => s + (d.calculatedCO2e ?? 0), 0)
    const totalQty = rows.reduce((s, d) => s + d.quantity, 0)

    return {
      type,
      label: labels[type],
      totalQuantity: totalQty,
      unit: units[type],
      totalCO2e,
      percentage: total > 0 ? (totalCO2e / total) * 100 : 0,
      count: rows.length,
    }
  })
}

// ─────────────────────────────────────────
// 유틸리티 함수
// ─────────────────────────────────────────

// 전월 대비 증감률 계산 (KPI 카드 트렌드 표시용)
// 양수 = 증가(나쁨), 음수 = 감소(좋음)
export function getMonthOverMonthChange(
  monthly: MonthlyEmission[]
): { month: string; change: number; changePercent: number }[] {
  return monthly.map((m, i) => {
    if (i === 0) return { month: m.month, change: 0, changePercent: 0 }
    const prev = monthly[i - 1].total
    const change = m.total - prev
    const changePercent = prev > 0 ? (change / prev) * 100 : 0
    return { month: m.month, change, changePercent }
  })
}

// CO2e 값을 읽기 좋은 형식으로 변환
// 1000 이상이면 tCO2e, 미만이면 kgCO2e로 표시
export function formatCO2e(value: number, digits = 1): string {
  if (value >= 1000) return `${(value / 1000).toFixed(digits)} tCO₂e`
  return `${value.toFixed(digits)} kgCO₂e`
}