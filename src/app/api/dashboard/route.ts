import { NextRequest, NextResponse } from "next/server";
import { getActivityData } from "@/lib/store";
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
    getYearOverYearChange
} from "@/lib/calculations";

// GET /api/dashboard
// 대시보드에 필요한 모든 집계 데이터를 한번에 반환
// 프론트에서 여러 번 API를 호출하지 않아도 되도록 하나로 묶음
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const period = searchParams.get('period') ?? 'monthly'

        const data = getActivityData()
        const selectedEmissions = 
            period === 'daily' ? getDailyEmissions(data) :
            period === 'weekly' ? getWeeklyEmissions(data) :
            period === 'yearly' ? getYearlyEmissions(data) : 
                                  getMonthlyEmissions(data) // 기본값은 월별 집계

        const selectedPeriodOverPeriodChange =
            period === 'daily' ? getDayOverDayChange(getDailyEmissions(data)) :
            period === 'weekly' ? getWeekOverWeekChange(getWeeklyEmissions(data)) :
            period === 'yearly' ? getYearOverYearChange(getYearlyEmissions(data)) : 
                                  getMonthOverMonthChange(getMonthlyEmissions(data))


        //KPI 카드용 핵심 수치
        const totalCO2e = calculateTotalCO2e(data)
        
        const kpis = {
            totalCO2e,                                    // 전체 배출량
            scope1: calculateScopeCO2e(data, 1),          // Scope 1 배출량
            scope2: calculateScopeCO2e(data, 2),          // Scope 2 배출량
            scope3: calculateScopeCO2e(data, 3),          // Scope 3 배출량
            totalRecords: data.length,                    // 총 데이터 건수
            latestMonth: selectedEmissions[selectedEmissions.length - 1]?.total ?? 0,       // 최근 일/월/주/년 배출량
            prevMonth: selectedEmissions[selectedEmissions.length - 2]?.total ?? 0,         // 전 일/월/주/년 배출량
            latestMonthLabel: selectedEmissions[selectedEmissions.length - 1]?.date ?? '', // 최근 일/월/주/년 라벨
        }
        return NextResponse.json({
            success:true,
            data:{
                kpis,
                monthly:selectedEmissions, //선택된 기간의 집계 데이터 (일/주/월/년)
                scopeBreakdown:getScopeBreakdown(data),
                activitySummary:getActivitySummary(data),
                periodOverPeriodChange:selectedPeriodOverPeriodChange,
                rawData:data, //원본 데이터도 같이 보내서 프론트에서 필요한 추가 집계 가능하게 (필터링, 상세보기 등)
            },
    })
    } catch (error) {
        console.error("Error fetching dashboard data:", error)
        return NextResponse.json(
            { success:false, error: "대시보드 데이터 조회에 실패했습니다." }, 
            { status: 500 }
        )
    }
}