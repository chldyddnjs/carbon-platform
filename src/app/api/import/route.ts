import { NextRequest, NextResponse } from 'next/server'
import { addActivityData } from '@/lib/store'
import { importRowSchema } from '@/lib/schemas'

// POST /api/import
// CSV 파일 임포트
// xlsx는 클라이언트에서 파싱 후 /api/import/json 으로 전송
// 이유: xlsx 라이브러리가 Next.js Edge Runtime 비호환 + 바이너리 파일 서버 전송 시 메모리 부담
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: '파일이 없습니다.' },
        { status: 400 }
      )
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        { success: false, error: 'CSV 파일만 지원합니다. xlsx는 UI에서 직접 파싱됩니다.' },
        { status: 400 }
      )
    }

    const text = await file.text()
    const lines = text.split('\n').filter((l) => l.trim())

    if (lines.length < 2) {
      return NextResponse.json(
        { success: false, error: 'CSV 파일에 데이터가 없습니다.' },
        { status: 400 }
      )
    }

    // 헤더 파싱 — 한글/영문 컬럼명 모두 지원
    // includes()로 유연하게 매칭하는 이유:
    //   '일자(원본)' 처럼 괄호가 붙어있어도 '일자'로 찾을 수 있게
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
    const idx = {
      date: headers.findIndex((h) => h.includes('일자') || h.includes('날짜') || h.includes('date')),
      type: headers.findIndex((h) => h.includes('활동') || h.includes('type')),
      desc: headers.findIndex((h) => h.includes('설명') || h.includes('desc')),
      qty:  headers.findIndex((h) => h.includes('량') || h.includes('qty') || h.includes('quantity')),
      unit: headers.findIndex((h) => h.includes('단위') || h.includes('unit')),
    }

    // 데이터 행 파싱
    const rows = lines.slice(1).map((line) => {
      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''))
      return {
        date:         cols[idx.date >= 0 ? idx.date : 0],
        activityType: cols[idx.type >= 0 ? idx.type : 1],
        description:  cols[idx.desc >= 0 ? idx.desc : 2],
        quantity:     cols[idx.qty  >= 0 ? idx.qty  : 3],
        unit:         cols[idx.unit >= 0 ? idx.unit : 4] || '',
      }
    })

    // Zod로 행 단위 유효성 검사
    // 에러가 있는 행은 건너뛰고 유효한 행만 저장
    const validRows: Array<{
      date: Date
      activityType: string
      description: string
      quantity: number
      unit: string
    }> = []
    const errors: string[] = []

    rows.forEach((row, i) => {
      const result = importRowSchema.safeParse(row)
      if (result.success) {
        validRows.push(result.data)
      } else {
        const messages = result.error.issues.map((e) => e.message).join(', ')
        errors.push(`행 ${i + 2}: ${messages}`)
      }
    })

    // 유효한 행만 저장
    const added = await addActivityData(
      validRows.map((r) => ({
        date: r.date,
        activityType: r.activityType as any,
        description: r.description,
        quantity: r.quantity,
        unit: r.unit,
      }))
    )

    return NextResponse.json({
      success: true,
      data: {
        imported: added.length,
        failed: errors.length,
        errors,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '파일 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}