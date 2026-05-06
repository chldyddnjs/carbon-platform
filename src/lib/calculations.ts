import { 
  ActivityData, 
  GHGScope, 
  MonthlyEmission,
  DailyEmission,
  WeeklyEmission,
  YearlyEmission, 
  ScopeBreakdown, 
  ActivitySummary, 
  ActivityType, 
  BaseEmission,
} from './types'
import { format } from 'date-fns'

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

/**
 * [공통] 기간별 배출량 집계 로직
 * @param data 원본 활동 데이터 배열
 * @param dateFormat 'yyyy-MM-dd', 'yyyy-WW', 'yyyy-MM', 'yyyy' 등 date-fns 포맷
 */
function getEmissionsByPeriod<T extends BaseEmission>(
  data: ActivityData[],
  dateFormat: string
): T[] {
  const periodMap = new Map<string, T>();

  for (const row of data) {
    const d = row.date instanceof Date ? row.date : new Date(row.date);
    const periodKey = format(d, dateFormat);
    const co2e = row.calculatedCO2e ?? 0;

    if (!periodMap.has(periodKey)) {
      periodMap.set(periodKey, {
        date: periodKey,
        electricity: 0,
        rawMaterial: 0,
        transport: 0,
        total: 0,
        scope1: 0,
        scope2: 0,
        scope3: 0,
      } as unknown as T);
    }

    const entry = periodMap.get(periodKey)!;

    // 활동 유형별 누적
    entry.total += co2e;
    if (row.activityType === 'electricity') entry.electricity += co2e;
    else if (row.activityType === 'raw_material') entry.rawMaterial += co2e;
    else if (row.activityType === 'transport') entry.transport += co2e;

    // Scope별 누적
    if (row.scope === 1) entry.scope1 += co2e;
    else if (row.scope === 2) entry.scope2 += co2e;
    else if (row.scope === 3) entry.scope3 += co2e;
  }

  // 날짜순 정렬 후 배열 반환
  return Array.from(periodMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

// 일별 배출량 집계
export const getDailyEmissions = (data: ActivityData[]): DailyEmission[] => 
  getEmissionsByPeriod(data, 'yyyy-MM-dd');

// 주별 배출량 집계 (ISO 주차 기준)
export const getWeeklyEmissions = (data: ActivityData[]): WeeklyEmission[] => 
  getEmissionsByPeriod(data, 'yyyy-II'); // date-fns에서 ISO 주차는 II를 권장합니다.

// 월별 배출량 집계
export const getMonthlyEmissions = (data: ActivityData[]): MonthlyEmission[] => 
  getEmissionsByPeriod(data, 'yyyy-MM');

// 연도별 배출량 집계
export const getYearlyEmissions = (data: ActivityData[]): YearlyEmission[] => 
  getEmissionsByPeriod(data, 'yyyy');


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

function getPeriodOverPeriodChange<T extends BaseEmission>(
  data: T[],
  labelKey: string // 'day', 'week', 'month', 'year' 등 결과 객체에 담을 키 이름
) {
  return data.map((curr, i) => {
    const prevTotal = i === 0 ? 0 : data[i - 1].total;
    const change = i === 0 ? 0 : curr.total - prevTotal;
    const changePercent = prevTotal > 0 ? (change / prevTotal) * 100 : 0;

    return {
      [labelKey]: curr.date,
      change,
      changePercent,
    };
  });
}

export const getDayOverDayChange = (daily: BaseEmission[]) => getPeriodOverPeriodChange(daily, 'day');
export const getWeekOverWeekChange = (weekly: BaseEmission[]) => getPeriodOverPeriodChange(weekly, 'week');
export const getMonthOverMonthChange = (monthly: BaseEmission[]) => getPeriodOverPeriodChange(monthly, 'month');
export const getYearOverYearChange = (yearly: BaseEmission[]) => getPeriodOverPeriodChange(yearly, 'year');