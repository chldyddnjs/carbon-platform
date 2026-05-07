'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { BaseEmission, PeriodType } from '@/lib/types'
import { CHART_COLORS } from '@/lib/colors'

interface MonthlyChartProps {
  data: BaseEmission[]
  period: PeriodType
  viewMode: 'activity' | 'scope'
  onViewModeChange: (mode: 'activity' | 'scope') => void
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg min-w-[200px]">
      <p className="text-xs font-bold text-slate-500 mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex justify-between items-center gap-4 text-xs mb-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.fill }} />
            <span className="text-slate-500">{entry.name}</span>
          </span>
          <span className="font-mono font-semibold text-slate-700">
            {Number(entry.value).toFixed(1)} kgCO₂e
          </span>
        </div>
      ))}
      <div className="flex justify-between mt-2 pt-2 border-t border-slate-100 text-xs font-bold text-green-600">
        <span>합계</span>
        <span className="font-mono">
          {payload.reduce((s: number, p: any) => s + Number(p.value), 0).toFixed(1)} kgCO₂e
        </span>
      </div>
    </div>
  )
}

const PERIOD_FORMAT: Record<PeriodType, (date: string) => string> = {
  day:   (d) => d.slice(5),        // '01-01'
  week:  (d) => `${d}주`,          // '2025-01주'
  month: (d) => d.slice(5) + '월', // '01월'
  year:  (d) => d + '년',          // '2025년'
}

export function MonthlyChart({ data, period, viewMode, onViewModeChange }: MonthlyChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: PERIOD_FORMAT[period](d.date),
    전기:      Number(d.electricity.toFixed(2)),
    원소재:    Number(d.rawMaterial.toFixed(2)),
    운송:      Number(d.transport.toFixed(2)),
    'Scope 2': Number(d.scope2.toFixed(2)),
    'Scope 3': Number(d.scope3.toFixed(2)),
  }))

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-700">배출량 추이</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {viewMode === 'activity' ? '활동 유형별' : 'GHG Scope별'} • 단위: kgCO₂e
          </p>
        </div>
        <div className="flex gap-1.5">
          {(['activity', 'scope'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                viewMode === mode
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {mode === 'activity' ? '활동 유형별' : 'Scope별'}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
          {viewMode === 'activity' ? (
            <>
              <Bar dataKey="전기"   stackId="a" fill={CHART_COLORS.electricity} radius={[0,0,0,0]} />
              <Bar dataKey="원소재" stackId="a" fill={CHART_COLORS.rawMaterial} radius={[0,0,0,0]} />
              <Bar dataKey="운송"   stackId="a" fill={CHART_COLORS.transport}   radius={[4,4,0,0]} />
            </>
          ) : (
            <>
              <Bar dataKey="Scope 2" stackId="b" fill={CHART_COLORS.scope2} radius={[0,0,0,0]} />
              <Bar dataKey="Scope 3" stackId="b" fill={CHART_COLORS.scope3} radius={[4,4,0,0]} />
            </>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}