import { NextRequest, NextResponse } from 'next/server'
import { getActivityData } from '@/lib/store'
import {
  calculateTotalCO2e,
  calculateScopeCO2e,
  getDailyEmissions,
  getWeeklyEmissions,
  getMonthlyEmissions,
  getYearlyEmissions,
  getScopeBreakdown,
  getActivitySummary,
  getDayOverDayChange,
  getWeekOverWeekChange,
  getMonthOverMonthChange,
  getYearOverYearChange,
} from '@/lib/calculations'
import { PeriodType } from '@/lib/types'

// GET /api/dashboard?period=month
// period: 'day' | 'week' | 'month' | 'year' (기본값: month)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const period = (searchParams.get('period') ?? 'month') as PeriodType

    // 전체 데이터 조회
    const allData = await getActivityData()

    // 기간별 집계 데이터
    const daily   = getDailyEmissions(allData)
    const weekly  = getWeeklyEmissions(allData)
    const monthly = getMonthlyEmissions(allData)
    const yearly  = getYearlyEmissions(allData)

    // period에 따라 차트에 보여줄 데이터 선택
    const periodDataMap = {
      day:   { emissions: daily,   changes: getDayOverDayChange(daily) },
      week:  { emissions: weekly,  changes: getWeekOverWeekChange(weekly) },
      month: { emissions: monthly, changes: getMonthOverMonthChange(monthly) },
      year:  { emissions: yearly,  changes: getYearOverYearChange(yearly) },
    }

    const { emissions, changes } = periodDataMap[period]

    // KPI는 전체 데이터 기준
    const totalCO2e = calculateTotalCO2e(allData)

    // 전기간 대비 증감률
    const lastChange = changes[changes.length - 1]
    // const prevChange = changes[changes.length - 2]

    const kpis = {
      totalCO2e,
      scope1: calculateScopeCO2e(allData, 1),
      scope2: calculateScopeCO2e(allData, 2),
      scope3: calculateScopeCO2e(allData, 3),
      totalRecords: allData.length,
      latestPeriod:      emissions[emissions.length - 1]?.total ?? 0,
      prevPeriod:        emissions[emissions.length - 2]?.total ?? 0,
      latestPeriodLabel: emissions[emissions.length - 1]?.date ?? '',
      changePercent:     lastChange?.changePercent ?? 0,
    }

    return NextResponse.json({
      success: true,
      data: {
        kpis,
        emissions,           // 차트용 (선택된 period 기준)
        scopeBreakdown: getScopeBreakdown(allData),
        activitySummary: getActivitySummary(allData),
        rawData: allData,
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { success: false, error: '대시보드 데이터 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}