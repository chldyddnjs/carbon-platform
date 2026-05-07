'use client'

import { useEffect, useState, useCallback } from 'react'
import { KpiCard, PeriodTabs } from '@/components/dashboard/KpiCard'
import { MonthlyChart } from '@/components/dashboard/MonthlyChart'
import { ScopeChart } from '@/components/dashboard/ScopeChart'
import { ActivitySummaryTable } from '@/components/dashboard/ActivitySummaryTable'
import { RawDataTable } from '@/components/dashboard/RawDataTable'
import { PeriodType } from '@/lib/types'
import { API } from '@/lib/api'

export default function DashboardPage() {
  const [data, setData]         = useState<any>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [period, setPeriod]     = useState<PeriodType>('month')
  const [viewMode, setViewMode] = useState<'activity' | 'scope'>('activity')

  
  const fetchData = useCallback(async () => {
    try {
      const res  = await fetch(API.dashboard(period))
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
        setData(json.data)
    } catch (e: any) {
      setError(e.message || '데이터 로딩 실패')
    } finally {
      setLoading(false)
    }
  }, [period])
  
  useEffect(() => { fetchData() }, [fetchData])
  
  //무한 루프 방지
  const handleDeleteAll = useCallback(() => {
    fetchData()
  },[fetchData])

  //무한 루프 방지
  const handleDelete = useCallback(() => { 
    fetchData()
  },[fetchData])

  if (error) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-red-500">오류: {error}</p>
    </div>
  )

  const { kpis, emissions, scopeBreakdown, activitySummary, rawData } = data ?? {}

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">

      {/* 헤더 */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-green-50 text-green-700 border border-green-200">
              사업장 CT-045
            </span>
            <span className="text-xs text-slate-400">컴퓨터 화면 제조 라인</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">탄소 발자국 대시보드</h1>
          <p className="text-sm text-slate-500 mt-1">
            GHG Protocol 기반 제품 탄소 발자국(PCF) 전과정 데이터 시각화
          </p>
        </div>
        <PeriodTabs period={period} onChange={setPeriod} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">데이터 로딩 중…</p>
          </div>
        </div>
      ) : (
        <>
          {/* KPI 카드 */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <KpiCard
              title="총 배출량"
              value={`${((kpis?.totalCO2e ?? 0) / 1000).toFixed(3)} tCO₂e`}
              subtitle={`${(kpis?.totalCO2e ?? 0).toFixed(1)} kgCO₂e`}
              accentColor="border-green-500"
            />
            <KpiCard
              title="Scope 2 (전력)"
              value={`${(kpis?.scope2 ?? 0).toFixed(0)} kgCO₂e`}
              subtitle="간접 배출 · 구매 전력"
              accentColor="border-blue-500"
            />
            <KpiCard
              title="Scope 3 (공급망)"
              value={`${(kpis?.scope3 ?? 0).toFixed(0)} kgCO₂e`}
              subtitle="원소재 + 운송"
              accentColor="border-amber-500"
            />
            <KpiCard
              title={`최근 ${period === 'day' ? '일' : period === 'week' ? '주' : period === 'month' ? '월' : '년'}`}
              value={`${(kpis?.latestPeriod ?? 0).toFixed(0)} kgCO₂e`}
              subtitle={kpis?.latestPeriodLabel ?? ''}
              trend={{ value: kpis?.changePercent ?? 0, label: '전기간 대비' }}
              accentColor="border-orange-500"
            />
          </div>

          {/* 차트 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="col-span-2">
              <MonthlyChart
                data={emissions ?? []}
                period={period}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            </div>
            <ScopeChart data={scopeBreakdown ?? []} totalCO2e={kpis?.totalCO2e ?? 0} />
          </div>

          {/* 요약 테이블 */}
          <div className="mb-6">
            <ActivitySummaryTable data={activitySummary ?? []} />
          </div>

          {/* 원본 데이터 */}
          <RawDataTable 
            data={rawData ?? []} 
            onDelete={handleDelete}
            onDeleteAll={handleDeleteAll}
          />

          <p className="mt-6 text-center text-xs text-slate-400 border-t border-slate-100 pt-4">
            배출계수 출처: 한국전력공사(KEPCO) · IPCC 2023 / ecoinvent 3.9 · 환경부 국가 온실가스 인벤토리 2024
          </p>
        </>
      )}
    </div>
  )
}