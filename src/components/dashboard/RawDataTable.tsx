'use client'

import { useState } from 'react'
import { ActivityData } from '@/lib/types'
import { format } from 'date-fns'
import { API } from '@/lib/api'
import { Badge } from '@/components/ui/Badge'

interface RawDataTableProps {
  data: ActivityData[]
  onDelete?: (id: string) => void
  onDeleteAll?: () => void
}

const TYPE_LABELS: Record<string, string> = {
  electricity: '전기',
  raw_material: '원소재',
  transport: '운송',
}

const TYPE_COLORS: Record<string, string> = {
  electricity: '#3b82f6',
  raw_material: '#f59e0b',
  transport: '#f97316',
}

const SCOPE_COLORS: Record<number, { bg: string; color: string }> = {
  1: { bg: '#f0fdf4', color: '#16a34a' },
  2: { bg: '#eff6ff', color: '#2563eb' },
  3: { bg: '#fffbeb', color: '#d97706' },
}

export function RawDataTable({ 
  data, 
  onDelete ,
  onDeleteAll
}: RawDataTableProps) {
  const [page, setPage]           = useState(1)
  const [filterType, setFilterType] = useState<string>('all')
  const [deleting, setDeleting]   = useState<string | null>(null)
  const pageSize = 15

  const filtered = filterType === 'all'
    ? data
    : data.filter((d) => d.activityType === filterType)

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  async function handleDeleteAll() {
    if (!onDeleteAll) return
    if (!confirm('모든 활동 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
    try {
      const res = await fetch(API.activities.deleteAll(), { method: 'DELETE' })
      const json = await res.json()
      if (json.success) onDeleteAll()
      else alert('전체 삭제 실패: ' + (json.error || '알 수 없는 오류'))
    } catch (error) {
      alert('네트워크 오류가 발생했습니다.')
    }
  }

  async function handleDelete(id: string) {
    if (!onDelete) return
    if (!confirm('이 항목을 삭제하시겠습니까?')) return
    setDeleting(id)
    try {
      const res = await fetch(API.activities.delete(id), { method: 'DELETE' })
      const json = await res.json()
      if (json.success) onDelete(id)
      else alert('삭제 실패: ' + (json.error || '알 수 없는 오류'))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="card">
      <div className="p-5 pb-3 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-700">활동 데이터 목록</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            총 {filtered.length}건 · {filtered.reduce((s, d) => s + (d.calculatedCO2e ?? 0), 0).toFixed(1)} kgCO₂e
          </p>
        </div>

        {/* 필터 탭 + 전체 삭제*/}
        <div className="flex gap-1.5">
          {['all', 'electricity', 'raw_material', 'transport'].map((type) => (
            <button
              key={type}
              onClick={() => { setFilterType(type); setPage(1) }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                filterType === type
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {type === 'all' ? '전체' : TYPE_LABELS[type]}
            </button>
          ))}
        </div>
        {/*전체 삭제 버튼*/}
        {onDeleteAll && data.length > 0 && (
          <button
            onClick={handleDeleteAll}
            className="px-3 py-1 rounded-lg text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50 transition-all"
          >
            전체 삭제
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr>
              <th className="text-left">날짜</th>
              <th className="text-left">유형</th>
              <th className="text-left">설명</th>
              <th className="text-right">활동량</th>
              <th className="text-right">배출계수</th>
              <th className="text-right">배출량 (kgCO₂e)</th>
              <th className="text-center">Scope</th>
              {onDelete && <th />}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400">
                  데이터가 없습니다
                </td>
              </tr>
            ) : paged.map((row) => {
              const scopeStyle = SCOPE_COLORS[row.scope]
              const typeColor  = TYPE_COLORS[row.activityType]
              return (
                <tr key={row.id}>
                  <td className="font-mono text-xs text-slate-500">
                    {format(new Date(row.date), 'yyyy.MM.dd')}
                  </td>
                  <td>
                    <Badge
                      label={TYPE_LABELS[row.activityType]}
                      color={row.activityType === 'electricity' ? 'blue' : row.activityType === 'raw_material' ? 'amber' : 'orange'}
                    />
                  </td>
                  <td className="text-slate-600">{row.description}</td>
                  <td className="text-right font-mono text-xs text-slate-500">
                    {row.quantity.toLocaleString('ko-KR')} {row.unit}
                  </td>
                  <td className="text-right font-mono text-xs text-slate-400">
                    {row.emissionFactor != null
                      ? `${row.emissionFactor} kgCO₂e/${row.unit}`
                      : '—'}
                  </td>
                  <td className="text-right font-mono font-bold text-sm" style={{ color: typeColor }}>
                    {row.calculatedCO2e != null
                      ? row.calculatedCO2e.toFixed(2)
                      : <span className="text-slate-300">미계산</span>}
                  </td>
                  <td className="text-center">
                    <span
                      className="inline-block text-xs px-1.5 py-0.5 rounded font-mono font-bold"
                      style={{ background: scopeStyle.bg, color: scopeStyle.color }}
                    >
                      S{row.scope}
                    </span>
                  </td>
                  {onDelete && (
                    <td className="text-center">
                      <button
                        onClick={() => handleDelete(row.id)}
                        disabled={deleting === row.id}
                        className="text-xs px-2 py-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      >
                        {deleting === row.id ? '…' : '삭제'}
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
          <span className="text-xs text-slate-400">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} / {filtered.length}건
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded text-xs border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
            >
              ← 이전
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded text-xs font-mono ${
                    p === page
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'border border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded text-xs border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
            >
              다음 →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}