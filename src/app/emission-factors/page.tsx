'use client'

import { useEffect, useState } from 'react'
import { EmissionFactor, ActivityType, ACTIVITY_LABELS } from '@/lib/types'
import { API } from '@/lib/api'

const CATEGORY_COLORS: Record<ActivityType, { text: string; bg: string; border: string }> = {
  electricity:  { text: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200'  },
  raw_material: { text: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
  transport:    { text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200'},
}

interface NewFactorForm {
  category:    ActivityType | ''
  subCategory: string
  factor:      string
  unit:        string
  source:      string
}

export default function EmissionFactorsPage() {
  const [factors, setFactors]   = useState<EmissionFactor[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess]   = useState<string | null>(null)
  const [errors, setErrors]     = useState<Record<string, string>>({})
  const [form, setForm]         = useState<NewFactorForm>({
    category: '', subCategory: '', factor: '', unit: '', source: '',
  })

  const UNIT_MAP: Record<ActivityType, string> = {
    electricity:  'kWh',
    raw_material: 'kg',
    transport:    'ton-km',
  }

  useEffect(() => {
    fetch('/api/emission-factors')
      .then((r) => r.json())
      .then((j) => { if (j.success) setFactors(j.data) })
      .finally(() => setLoading(false))
  }, [])

  function validate() {
    const e: Record<string, string> = {}
    if (!form.category)    e.category    = '카테고리를 선택해주세요.'
    if (!form.subCategory) e.subCategory = '세부 항목을 입력해주세요.'
    if (!form.factor || isNaN(Number(form.factor)) || Number(form.factor) <= 0) {
      e.factor = '0보다 큰 숫자를 입력해주세요.'
    }
    if (!form.source) e.source = '출처를 입력해주세요.'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    try {
      const res  = await fetch(API.emissionFactors.create(), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category:    form.category,
          subCategory: form.subCategory,
          factor:      Number(form.factor),
          unit:        form.unit,
          source:      form.source,
        }),
      })
      const json = await res.json()
      if (json.success) {
        // 목록 새로고침
        const fresh = await fetch(API.emissionFactors.list())
                            .then((r) => r.json())
        if (fresh.success) setFactors(fresh.data)
        setSuccess(`✓ "${form.subCategory}" 배출계수가 등록되었습니다.`)
        setShowForm(false)
        setForm({ category: '', subCategory: '', factor: '', unit: '', source: '' })
        setTimeout(() => setSuccess(null), 4000)
      } else {
        setErrors({ submit: json.errors?.join(', ') || json.error })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const activeFactors  = factors.filter((f) => f.isActive)
  const historyFactors = factors.filter((f) => !f.isActive)

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">

      {/* 헤더 */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">배출계수 관리</h1>
          <p className="text-sm text-slate-500 mt-1">버전 이력이 추적되는 배출계수 라이브러리</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
            showForm
              ? 'bg-slate-100 text-slate-600 border border-slate-200'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {showForm ? '취소' : '+ 새 배출계수'}
        </button>
      </div>

      {/* 성공 메시지 */}
      {success && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium bg-green-50 text-green-700 border border-green-200">
          {success}
        </div>
      )}

      {/* 새 배출계수 등록 폼 */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 mb-6 space-y-4">
          <h3 className="font-bold text-sm text-slate-700">새 배출계수 등록</h3>

          {/* 카테고리 */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              카테고리 *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['electricity', 'raw_material', 'transport'] as ActivityType[]).map((cat) => {
                const c = CATEGORY_COLORS[cat]
                const selected = form.category === cat
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, category: cat, unit: UNIT_MAP[cat] }))
                      setErrors((e) => ({ ...e, category: '' }))
                    }}
                    className={`py-2 rounded-lg text-xs font-semibold transition-all border-2 ${
                      selected
                        ? `${c.bg} ${c.text} ${c.border}`
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {ACTIVITY_LABELS[cat]}
                  </button>
                )
              })}
            </div>
            {errors.category && <p className="mt-1 text-xs text-red-500">⚠ {errors.category}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 세부 항목 */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                세부 항목 *
              </label>
              <input
                type="text"
                value={form.subCategory}
                onChange={(e) => setForm((f) => ({ ...f, subCategory: e.target.value }))}
                placeholder="예: 플라스틱 3"
                className={`w-full px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 ${
                  errors.subCategory ? 'border-red-300 bg-red-50' : 'border-slate-200'
                }`}
              />
              {errors.subCategory && <p className="mt-1 text-xs text-red-500">⚠ {errors.subCategory}</p>}
            </div>

            {/* 배출계수 */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                배출계수 (kgCO₂e/{form.unit || 'unit'}) *
              </label>
              <input
                type="number"
                value={form.factor}
                step="any"
                min="0"
                onChange={(e) => setForm((f) => ({ ...f, factor: e.target.value }))}
                placeholder="예: 2.3"
                className={`w-full px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 ${
                  errors.factor ? 'border-red-300 bg-red-50' : 'border-slate-200'
                }`}
              />
              {errors.factor && <p className="mt-1 text-xs text-red-500">⚠ {errors.factor}</p>}
            </div>
          </div>

          {/* 출처 */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              출처 *
            </label>
            <input
              type="text"
              value={form.source}
              onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
              placeholder="예: IPCC 2023 / ecoinvent 3.9"
              className={`w-full px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 ${
                errors.source ? 'border-red-300 bg-red-50' : 'border-slate-200'
              }`}
            />
            {errors.source && <p className="mt-1 text-xs text-red-500">⚠ {errors.source}</p>}
          </div>

          {errors.submit && <p className="text-xs text-red-500">⚠ {errors.submit}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition-all disabled:opacity-50"
          >
            {submitting ? '등록 중…' : '배출계수 등록'}
          </button>
        </form>
      )}

      {/* 현재 활성 배출계수 */}
      <div className="card mb-4">
        <div className="p-5 pb-3">
          <h2 className="font-bold text-sm text-slate-700">현재 활성 배출계수</h2>
          <p className="text-xs text-slate-400 mt-0.5">PCF 계산에 사용되는 최신 계수</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">카테고리</th>
                <th className="text-left">세부 항목</th>
                <th className="text-right">배출계수</th>
                <th className="text-left">단위</th>
                <th className="text-center">버전</th>
                <th className="text-left">출처</th>
                <th className="text-left">적용 시작일</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400 text-sm">로딩 중…</td></tr>
              ) : activeFactors.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400 text-sm">등록된 배출계수가 없습니다</td></tr>
              ) : activeFactors.map((f) => {
                const c = CATEGORY_COLORS[f.category as ActivityType]
                return (
                  <tr key={f.id}>
                    <td>
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-semibold ${c.bg} ${c.text} border ${c.border}`}>
                        {ACTIVITY_LABELS[f.category as ActivityType]}
                      </span>
                    </td>
                    <td className="font-medium text-slate-700">{f.subCategory}</td>
                    <td className={`text-right font-mono font-bold ${c.text}`}>{f.factor}</td>
                    <td className="text-xs text-slate-400">kgCO₂e / {f.unit}</td>
                    <td className="text-center">
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-green-50 text-green-700">
                        v{f.version}
                      </span>
                    </td>
                    <td className="text-xs text-slate-400 max-w-[200px] truncate">{f.source}</td>
                    <td className="text-xs font-mono text-slate-400">
                      {new Date(f.validFrom).toLocaleDateString('ko-KR')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 이력 */}
      {historyFactors.length > 0 && (
        <div className="card">
          <div className="p-5 pb-3">
            <h2 className="font-bold text-sm text-slate-700">이력 (비활성)</h2>
            <p className="text-xs text-slate-400 mt-0.5">업데이트된 이전 버전</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr>
                  <th className="text-left">카테고리</th>
                  <th className="text-left">세부 항목</th>
                  <th className="text-right">배출계수</th>
                  <th className="text-center">버전</th>
                  <th className="text-left">만료일</th>
                </tr>
              </thead>
              <tbody>
                {historyFactors.map((f) => (
                  <tr key={f.id} className="opacity-50">
                    <td className="text-xs">{ACTIVITY_LABELS[f.category as ActivityType]}</td>
                    <td>{f.subCategory}</td>
                    <td className="text-right font-mono text-xs">{f.factor}</td>
                    <td className="text-center text-xs font-mono text-slate-400">v{f.version}</td>
                    <td className="text-xs font-mono text-slate-400">
                      {f.validUntil ? new Date(f.validUntil).toLocaleDateString('ko-KR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 설계 원칙 안내 */}
      <div className="mt-6 p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-500 leading-relaxed">
        <strong className="text-slate-600">💡 설계 원칙</strong>: 새 배출계수 등록 시 기존 계수는
        비활성(이력)으로 전환됩니다. 삭제하지 않는 이유는 과거 데이터가 당시 어떤 계수로
        계산됐는지 감사(audit) 추적이 가능해야 하기 때문입니다.
      </div>
    </div>
  )
}