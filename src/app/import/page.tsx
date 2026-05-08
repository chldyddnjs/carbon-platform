'use client'

import { useState, useRef, useCallback } from 'react'
import { API } from '@/lib/api'
import Link from 'next/link'

interface ImportResult {
  imported: number
  failed:   number
  errors:   string[]
}

// CSV 템플릿 — 과제 제공 데이터와 동일한 형식
const TEMPLATE_CSV = `일자(원본),활동 유형,설명,량,단위
2025-01-01,전기,한국전력,110,kWh
2025-01-01,원소재,플라스틱 1,230,kg
2025-01-01,운송,트럭,41,ton-km`

export default function ImportPage() {
  const [dragging, setDragging]     = useState(false)
  const [file, setFile]             = useState<File | null>(null)
  const [previewRows, setPreviewRows] = useState<any[] | null>(null)
  const [result, setResult]         = useState<ImportResult | null>(null)
  const [loading, setLoading]       = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [apiError, setApiError]     = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // CSV 템플릿 다운로드
  function downloadTemplate() {
    const blob = new Blob(['\uFEFF' + TEMPLATE_CSV], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'carbon_data_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // xlsx 파싱 — 클라이언트에서 처리
  // 서버에서 파싱하지 않는 이유: Edge Runtime 비호환 + 메모리 부담
  async function parseXlsx(f: File): Promise<any[]> {
    const XLSX = await import('xlsx')
    const ab   = await f.arrayBuffer()
    const wb   = XLSX.read(ab, { type: 'array', cellDates: true })
    const ws   = wb.Sheets[wb.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json(ws, { raw: false })

    // 한글/영문 컬럼명 모두 지원
    return (json as any[]).map((row: any) => ({
      date:         row['일자(원본)'] || row['날짜'] || row['date'],
      activityType: row['활동 유형'] || row['type'],
      description:  row['설명']     || row['description'],
      quantity:     Number(row['량'] || row['수량'] || row['quantity'] || 0),
      unit:         row['단위']     || row['unit'],
    }))
  }

  // CSV 파싱
  function parseCsv(text: string): any[] {
    const lines   = text.split('\n').filter((l) => l.trim())
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
    const idx = {
      date: headers.findIndex((h) => h.includes('일자') || h.includes('날짜') || h.includes('date')),
      type: headers.findIndex((h) => h.includes('활동') || h.includes('type')),
      desc: headers.findIndex((h) => h.includes('설명') || h.includes('desc')),
      qty:  headers.findIndex((h) => h.includes('량')   || h.includes('qty') || h.includes('quantity')),
      unit: headers.findIndex((h) => h.includes('단위') || h.includes('unit')),
    }

    return lines.slice(1).map((line) => {
      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
      return {
        date:         cols[idx.date >= 0 ? idx.date : 0],
        activityType: cols[idx.type >= 0 ? idx.type : 1],
        description:  cols[idx.desc >= 0 ? idx.desc : 2],
        quantity:     Number(cols[idx.qty  >= 0 ? idx.qty  : 3]),
        unit:         cols[idx.unit >= 0 ? idx.unit : 4] || '',
      }
    }).filter((r) => r.date && r.activityType)
  }

  async function handleFile(f: File) {
    setFile(f)
    setResult(null)
    setApiError(null)
    setParseError(null)
    setPreviewRows(null)

    try {
      let rows: any[]
      if (f.name.toLowerCase().endsWith('.xlsx') || f.name.toLowerCase().endsWith('.xls')) {
        rows = await parseXlsx(f)
      } else if (f.name.toLowerCase().endsWith('.csv')) {
        rows = parseCsv(await f.text())
      } else {
        setParseError('.xlsx 또는 .csv 파일만 지원합니다.')
        return
      }

      if (rows.length === 0) {
        setParseError('파일에서 유효한 데이터를 찾을 수 없습니다.')
        return
      }

      setPreviewRows(rows.slice(0, 5))
    } catch (e: any) {
      setParseError('파일 파싱 오류: ' + e.message)
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  async function handleImport() {
    if (!file) return
    setLoading(true)
    setApiError(null)

    try {
      let rows: any[]
      if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
        rows = await parseXlsx(file)
      } else {
        rows = parseCsv(await file.text())
      }

      const res  = await fetch(API.import.json(), {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ rows }),
      })
      const json = await res.json()

      if (!json.success) {
        setApiError(json.error || '임포트 실패')
        return
      }

      setResult(json.data)
    } catch (e: any) {
      setApiError('오류: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const TYPE_LABELS: Record<string, string> = {
    전기: '전기', electricity: '전기',
    원소재: '원소재', raw_material: '원소재',
    운송: '운송', transport: '운송',
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">파일 임포트</h1>
        <p className="text-sm text-slate-500 mt-1">
          Excel(.xlsx) 또는 CSV 파일로 활동 데이터를 일괄 업로드합니다.
        </p>
      </div>

      {/* 배출계수 등록 안내 */}
      <div className="mb-6 px-4 py-3 rounded-xl text-sm bg-amber-50 border border-amber-200 flex items-start gap-3">
        <span className="text-amber-500 text-lg shrink-0">⚠️</span>
        <div>
          <p className="font-semibold text-amber-700 mb-1">
            파일 임포트 전에 배출계수를 먼저 등록해주세요.
          </p>
          <p className="text-amber-600 text-xs">
            배출계수가 없으면 CO₂e가 계산되지 않아 대시보드 차트에 표시되지 않습니다.
          </p>
          <Link
            href="/emission-factors"
            className="inline-block mt-2 text-xs font-bold text-amber-700 underline hover:text-amber-800"
          >
            배출계수 관리 페이지로 이동 →
          </Link>
        </div>
      </div>
      {/* 템플릿 다운로드 */}
      <div className="card p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-700">📄 템플릿 다운로드</p>
          <p className="text-xs text-slate-400 mt-0.5">과제 제공 데이터와 동일한 형식의 CSV 템플릿</p>
        </div>
        <button
          onClick={downloadTemplate}
          className="px-4 py-2 rounded-lg text-xs font-bold text-green-700 bg-green-50 border border-green-200 hover:bg-green-100 transition-all"
        >
          CSV 템플릿 ↓
        </button>
      </div>

      {/* 드래그 앤 드롭 영역 */}
      <div
        className={`rounded-2xl p-10 text-center cursor-pointer transition-all mb-4 border-2 border-dashed ${
          dragging
            ? 'border-green-400 bg-green-50'
            : 'border-slate-200 bg-white hover:border-slate-300'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className="text-4xl mb-3">📂</div>
        <p className="text-sm font-semibold text-slate-700 mb-1">
          파일을 여기에 드래그하거나 클릭하여 선택
        </p>
        <p className="text-xs text-slate-400">지원 형식: .xlsx, .xls, .csv</p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
      </div>

      {/* 파싱 에러 */}
      {parseError && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm bg-red-50 text-red-600 border border-red-200">
          ⚠ {parseError}
        </div>
      )}

      {/* 파일 미리보기 */}
      {file && !parseError && (
        <div className="card p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-sm text-slate-700">📎 {file.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              onClick={() => { setFile(null); setPreviewRows(null); setResult(null) }}
              className="text-xs px-3 py-1 rounded-lg text-slate-400 border border-slate-200 hover:bg-slate-50"
            >
              제거
            </button>
          </div>

          {/* 미리보기 테이블 */}
          {previewRows && previewRows.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                미리보기 (최대 5행)
              </p>
              <div className="overflow-x-auto rounded-lg border border-slate-100">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50">
                      {['날짜', '유형', '설명', '수량', '단위'].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-slate-500 border-b border-slate-100">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="border-b border-slate-50 last:border-0">
                        <td className="px-3 py-2 font-mono">{String(row.date || '').substring(0, 10)}</td>
                        <td className="px-3 py-2">{TYPE_LABELS[row.activityType] || row.activityType}</td>
                        <td className="px-3 py-2">{row.description}</td>
                        <td className="px-3 py-2 font-mono">{row.quantity}</td>
                        <td className="px-3 py-2">{row.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={loading}
            className="mt-4 w-full py-3 rounded-xl font-bold text-sm text-white bg-green-600 hover:bg-green-700 transition-all disabled:opacity-50"
          >
            {loading ? '임포트 중…' : '데이터 임포트 실행'}
          </button>
        </div>
      )}

      {/* API 에러 */}
      {apiError && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm bg-red-50 text-red-600 border border-red-200">
          ⚠ {apiError}
        </div>
      )}

      {/* 임포트 결과 */}
      {result && (
        <div className="card p-5">
          <h3 className="font-bold text-sm text-slate-700 mb-4">임포트 결과</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="rounded-xl p-4 text-center bg-green-50 border border-green-100">
              <p className="text-2xl font-bold font-mono text-green-600">{result.imported}</p>
              <p className="text-xs text-slate-400 mt-1">성공</p>
            </div>
            <div className={`rounded-xl p-4 text-center border ${
              result.failed > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'
            }`}>
              <p className={`text-2xl font-bold font-mono ${result.failed > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                {result.failed}
              </p>
              <p className="text-xs text-slate-400 mt-1">실패</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="rounded-lg p-3 bg-slate-50 border border-slate-100">
              <p className="text-xs font-bold text-red-500 mb-2">오류 상세:</p>
              <ul className="text-xs text-slate-500 space-y-1">
                {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
            </div>
          )}

          {result.imported > 0 && (
            <p className="mt-3 text-xs text-center text-green-600">
              ✓ 대시보드에서 임포트된 데이터를 확인할 수 있습니다.
            </p>
          )}
        </div>
      )}

      {/* 형식 안내 */}
      <div className="mt-6 p-5 rounded-xl bg-white border border-slate-200 text-xs text-slate-500 leading-relaxed">
        <h3 className="font-bold text-slate-600 mb-2">📋 파일 형식 안내</h3>
        <ul className="space-y-1">
          <li>• <strong className="text-slate-600">필수 컬럼</strong>: 일자(원본), 활동 유형, 설명, 량, 단위</li>
          <li>• <strong className="text-slate-600">활동 유형 허용값</strong>: 전기 / 원소재 / 운송</li>
          <li>• <strong className="text-slate-600">날짜 형식</strong>: YYYY-MM-DD 권장</li>
          <li>• 과제 제공 Excel 파일을 <strong className="text-green-600">별도 가공 없이</strong> 그대로 업로드할 수 있습니다.</li>
        </ul>
      </div>
    </div>
  )
}