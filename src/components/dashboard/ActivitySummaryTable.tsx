'use client'

import { ActivitySummary } from '@/lib/types'

interface ActivitySummaryTableProps {
  data: ActivitySummary[]
}

const TYPE_COLORS: Record<string, string> = {
  electricity: '#3b82f6',
  raw_material: '#f59e0b',
  transport: '#f97316',
}

const SCOPE_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  electricity: { label: 'Scope 2', bg: 'bg-blue-50',   text: 'text-blue-600' },
  raw_material: { label: 'Scope 3', bg: 'bg-amber-50',  text: 'text-amber-600' },
  transport:    { label: 'Scope 3', bg: 'bg-orange-50', text: 'text-orange-600' },
}

export function ActivitySummaryTable({ data }: ActivitySummaryTableProps) {
  const totalCO2e = data.reduce((s, d) => s + d.totalCO2e, 0)

  return (
    <div className="card">
      <div className="p-5 pb-3">
        <h3 className="text-sm font-bold text-slate-700">활동 유형별 요약</h3>
        <p className="text-xs text-slate-400 mt-0.5">배출원 기여도 분석</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr>
              <th className="text-left">활동 유형</th>
              <th className="text-left">GHG Scope</th>
              <th className="text-right">활동량</th>
              <th className="text-right">배출량 (kgCO₂e)</th>
              <th className="text-right">비중</th>
              <th className="text-left w-32">비중 바</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-400">
                  데이터가 없습니다
                </td>
              </tr>
            ) : data.map((item) => {
              const badge = SCOPE_BADGE[item.type]
              const color = TYPE_COLORS[item.type]
              return (
                <tr key={item.type}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                      <span className="font-medium text-slate-700">{item.label}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-semibold ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="text-right font-mono text-xs text-slate-500">
                    {item.totalQuantity.toLocaleString('ko-KR', { maximumFractionDigits: 1 })} {item.unit}
                  </td>
                  <td className="text-right font-mono font-bold text-sm" style={{ color }}>
                    {item.totalCO2e.toFixed(1)}
                  </td>
                  <td className="text-right font-mono text-xs text-slate-500">
                    {item.percentage.toFixed(1)}%
                  </td>
                  <td>
                    <div className="h-2 rounded-full overflow-hidden bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${item.percentage}%`, background: color }}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="font-bold text-xs text-slate-500">합계</td>
              <td className="text-right font-bold font-mono text-green-600" style={{ fontSize: '0.95rem' }}>
                {totalCO2e.toFixed(1)}
              </td>
              <td className="text-right font-mono text-xs text-slate-400">100%</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}