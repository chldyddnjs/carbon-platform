'use client'

import { useState, useEffect } from 'react'
import { ActivityType, ACTIVITY_LABELS, ACTIVITY_SCOPE_MAP } from '@/lib/types'
import { API } from '@/lib/api'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { SuccessBanner } from '@/components/ui/SuccessBanner'
import { SectionHeader } from '@/components/ui/SectionHeader'

interface FormData {
  date: string
  activityType: ActivityType | ''
  description: string
  quantity: string
  unit: string
}

interface FieldErrors {
  date?: string
  activityType?: string
  description?: string
  quantity?: string
  unit?: string
}

// 활동 유형별 세부 항목 선택지
const DESCRIPTIONS: Record<ActivityType, string[]> = {
  electricity:  ['한국전력'],
  raw_material: ['플라스틱 1', '플라스틱 2', '알루미늄', '구리', '철강'],
  transport:    ['트럭', '철도', '선박', '항공'],
}

// 활동 유형별 단위
const UNITS: Record<ActivityType, string> = {
  electricity:  'kWh',
  raw_material: 'kg',
  transport:    'ton-km',
}

const ACTIVITY_CONFIG = [
  { type: 'electricity'  as ActivityType, icon: '⚡', label: '전기',   color: 'blue'   },
  { type: 'raw_material' as ActivityType, icon: '🏗️', label: '원소재', color: 'amber'  },
  { type: 'transport'    as ActivityType, icon: '🚛', label: '운송',   color: 'orange' },
]

const SCOPE_INFO: Record<ActivityType, string> = {
  electricity:  'Scope 2 — 간접 배출 (외부 구매 전력)',
  raw_material: 'Scope 3 — 기타 간접 배출 (공급망 원소재)',
  transport:    'Scope 3 — 기타 간접 배출 (물류·운송)',
}

export default function DataEntryPage() {
  const [form, setForm] = useState<FormData>({
    date:         new Date().toISOString().split('T')[0],
    activityType: '',
    description:  '',
    quantity:     '',
    unit:         '',
  })
  const [errors, setErrors]     = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [apiError, setApiError]   = useState<string | null>(null)

  // 활동 유형 변경 시 단위·설명 자동 세팅
  useEffect(() => {
    if (form.activityType) {
      setForm((f) => ({
        ...f,
        unit:        UNITS[form.activityType as ActivityType],
        description: DESCRIPTIONS[form.activityType as ActivityType][0],
      }))
    }
  }, [form.activityType])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setApiError(null)
    setSuccessMsg(null)

    // 클라이언트 유효성 검사
    const errs: FieldErrors = {}
    if (!form.date)         errs.date = '날짜를 입력해주세요.'
    if (!form.activityType) errs.activityType = '활동 유형을 선택해주세요.'
    if (!form.description)  errs.description = '설명을 입력해주세요.'
    if (!form.quantity) {
      errs.quantity = '수량을 입력해주세요.'
    } else if (isNaN(Number(form.quantity)) || Number(form.quantity) <= 0) {
      errs.quantity = '0보다 큰 숫자를 입력해주세요.'
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(API.activities.create(), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date:         form.date,
          activityType: form.activityType,
          description:  form.description,
          quantity:     Number(form.quantity),
          unit:         form.unit,
        }),
      })

      const json = await res.json()
      if (!json.success) {
        if (json.errors) setApiError(json.errors.join(', '))
        else setApiError(json.error || '저장 실패')
        return
      }

      const co2e = json.data?.calculatedCO2e
      setSuccessMsg(
        co2e != null
          ? `✓ 저장 완료! 계산된 배출량: ${co2e.toFixed(2)} kgCO₂e`
          : '✓ 저장 완료!'
      )

      // 수량만 초기화 (날짜·유형·설명은 유지 — 연속 입력 편의)
      setForm((f) => ({ ...f, quantity: '' }))
      setTimeout(() => setSuccessMsg(null), 5000)
    } catch {
      setApiError('네트워크 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-8">
        <SectionHeader
          title="활동 데이터 입력"
          subtitle="원소재·전기·운송 데이터를 입력하면 PCF가 자동으로 계산됩니다."
        />
      </div>

      {/* 성공 메시지 */}
      {successMsg && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium bg-green-50 text-green-700 border border-green-200 animate-fade-in">
          {successMsg && <div className="mb-4"><SuccessBanner message={successMsg} /></div>}
        </div>
      )}

      {/* API 에러 */}
      {apiError && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium bg-red-50 text-red-600 border border-red-200">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="card p-6 space-y-5">

          {/* 활동 유형 선택 */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              활동 유형 <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {ACTIVITY_CONFIG.map(({ type, icon, label, color }) => {
                const isSelected = form.activityType === type
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, activityType: type }))
                      setErrors((e) => ({ ...e, activityType: undefined }))
                    }}
                    className={`py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                      isSelected
                        ? `border-${color}-400 bg-${color}-50 text-${color}-700`
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xl mb-1">{icon}</div>
                    {label}
                  </button>
                )
              })}
            </div>
            {errors.activityType && (
              <p className="mt-1.5 text-xs text-red-500">⚠ {errors.activityType}</p>
            )}
          </div>

          {/* Scope 정보 */}
          {form.activityType && (
            <div className="px-3 py-2 rounded-lg text-xs text-slate-500 bg-slate-50 border border-slate-100">
              {SCOPE_INFO[form.activityType as ActivityType]}
            </div>
          )}

          {/* 날짜 */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              날짜 <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => {
                setForm((f) => ({ ...f, date: e.target.value }))
                setErrors((e2) => ({ ...e2, date: undefined }))
              }}
              className={`w-full px-4 py-2.5 rounded-xl text-sm border transition-all outline-none
                focus:ring-2 focus:ring-green-200 focus:border-green-400
                ${errors.date ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'}`}
            />
            {errors.date && <ErrorMessage message={errors.date} />}
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              설명 <span className="text-red-400">*</span>
            </label>
            {form.activityType ? (
              <select
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all"
              >
                {DESCRIPTIONS[form.activityType as ActivityType].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                disabled
                placeholder="먼저 활동 유형을 선택해주세요"
                className="w-full px-4 py-2.5 rounded-xl text-sm border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
              />
            )}
            {errors.description && (
              <p className="mt-1.5 text-xs text-red-500">⚠ {errors.description}</p>
            )}
          </div>

          {/* 수량 + 단위 */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              수량 <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={form.quantity}
                onChange={(e) => {
                  setForm((f) => ({ ...f, quantity: e.target.value }))
                  setErrors((e2) => ({ ...e2, quantity: undefined }))
                }}
                placeholder="예: 110"
                min="0"
                step="any"
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm border transition-all outline-none
                  focus:ring-2 focus:ring-green-200 focus:border-green-400
                  ${errors.quantity ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'}`}
              />
              <div className="px-4 py-2.5 rounded-xl text-sm font-mono font-bold min-w-[80px] flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-500">
                {form.unit || '단위'}
              </div>
            </div>
            {errors.quantity && (
              <p className="mt-1.5 text-xs text-red-500">⚠ {errors.quantity}</p>
            )}
          </div>

          {/* 저장 버튼 */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl font-bold text-sm text-white bg-green-600 hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '저장 중…' : '활동 데이터 저장'}
          </button>
        </div>
      </form>

      {/* 입력 가이드 */}
      <div className="mt-6 p-5 rounded-xl bg-white border border-slate-200">
        <h3 className="font-bold text-sm text-slate-600 mb-3">📘 입력 가이드</h3>
        <div className="space-y-2 text-xs text-slate-500 leading-relaxed">
          <p><strong className="text-blue-600">⚡ 전기</strong> — 한국전력 청구서의 월 사용량(kWh). 배출계수: 0.456 kgCO₂e/kWh</p>
          <p><strong className="text-amber-600">🏗️ 원소재</strong> — 생산에 투입된 플라스틱·금속 등의 질량(kg)</p>
          <p><strong className="text-orange-600">🚛 운송</strong> — 화물 운송량(톤) × 거리(km). 배출계수: 3.5 kgCO₂e/ton-km</p>
        </div>
      </div>
    </div>
  )
}