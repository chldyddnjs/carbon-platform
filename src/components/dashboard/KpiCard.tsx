'use client'

import { PeriodType, PERIOD_LABELS } from '@/lib/types'

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  trend?: { value: number; label: string }
  accentColor: string
}

export function KpiCard({ title, value, subtitle, trend, accentColor }: KpiCardProps) {
  const trendUp      = trend && trend.value > 0
  const trendNeutral = trend && trend.value === 0

  return (
    <div className={`card p-5 border-l-4 ${accentColor}`}>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
        {title}
      </p>
      <p className="text-2xl font-bold font-mono text-slate-900 mb-1">
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-slate-400">{subtitle}</p>
      )}
      {trend && (
        <p className={`mt-2 text-xs font-semibold flex items-center gap-1 ${
          trendNeutral ? 'text-slate-400' : trendUp ? 'text-red-500' : 'text-green-600'
        }`}>
          <span>{trendNeutral ? '—' : trendUp ? '▲' : '▼'}</span>
          <span>{Math.abs(trend.value).toFixed(1)}% {trend.label}</span>
        </p>
      )}
    </div>
  )
}

interface PeriodTabsProps {
  period: PeriodType
  onChange: (period: PeriodType) => void
}

export function PeriodTabs({ period, onChange }: PeriodTabsProps) {
  return (
    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
      {(Object.keys(PERIOD_LABELS) as PeriodType[]).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
            period === p
              ? 'bg-white text-green-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {PERIOD_LABELS[p]}
        </button>
      ))}
    </div>
  )
}