'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { ScopeBreakdown } from '@/lib/types'
import { CHART_COLORS } from '@/lib/colors'

interface ScopeChartProps {
  data: ScopeBreakdown[]
  totalCO2e: number
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as ScopeBreakdown
  if (!d || !d.label) return null  // ← 이 줄 추가
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg">
      <p className="text-xs font-bold mb-1" style={{ color: d.color }}>{d.label.replace('\n', ' ')}</p>
      <p className="text-sm font-bold font-mono text-slate-900">{d.value.toFixed(1)} kgCO₂e</p>
      <p className="text-xs text-slate-400">전체의 {d.percentage.toFixed(1)}%</p>
    </div>
  )
}

const RADIAN = Math.PI / 180
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
  if (percentage < 1) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  return (
    <text
      x={cx + r * Math.cos(-midAngle * RADIAN)}
      y={cy + r * Math.sin(-midAngle * RADIAN)}
      fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={11} fontWeight={700}
    >
      {percentage.toFixed(0)}%
    </text>
  )
}

export function ScopeChart({ data, totalCO2e }: ScopeChartProps) {
  const hasData = data.some((d) => d.value > 0)

  return (
    <div className="card p-5">
      <h3 className="text-sm font-bold text-slate-700 mb-0.5">GHG Scope 분포</h3>
      <p className="text-xs text-slate-400 mb-4">GHG Protocol 기준 Scope 1/2/3 분류</p>

      <div className="flex items-center gap-4">
        {/* 도넛 차트 */}
        <div className="relative shrink-0" style={{ width: 150, height: 150 }}>
          <ResponsiveContainer width={150} height={150}>
            <PieChart>
              <Pie
                data={hasData ? data : [{ value: 1, color: '#e2e8f0' } as any]}
                cx="50%" cy="50%"
                innerRadius={45} outerRadius={68}
                paddingAngle={hasData ? 2 : 0}
                dataKey="value"
                labelLine={false}
                label={hasData ? renderLabel : undefined}
              >
                {(hasData ? data : [{ color: '#e2e8f0' }]).map((e: any, i: number) => (
                  <Cell key={i} fill={e.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* 가운데 총 배출량 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs font-bold font-mono text-green-600">
              {(totalCO2e / 1000).toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400">tCO₂e</span>
          </div>
        </div>

        {/* 범례 */}
        <div className="flex flex-col gap-3 flex-1">
          {data.map((d) => (
            <div key={d.scope} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                <div>
                  <p className="text-xs font-semibold text-slate-600">Scope {d.scope}</p>
                  <p className="text-[10px] text-slate-400">
                    {d.scope === 1 ? '직접 배출' : d.scope === 2 ? '간접(구매 전력)' : '기타 간접'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold font-mono text-slate-700">{d.value.toFixed(0)}</p>
                <p className="text-[10px] text-slate-400">kgCO₂e</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GHG Protocol 설명 */}
      <p className="mt-4 p-3 rounded-lg text-xs text-slate-500 leading-relaxed bg-slate-50 border border-slate-100">
        <strong className="text-slate-600">GHG Protocol</strong>: 전력(Scope 2)과
        원소재·운송(Scope 3)이 주요 배출원이며, 직접 연소(Scope 1)는 미등록 상태입니다.
      </p>
    </div>
  )
}