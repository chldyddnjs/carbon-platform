import { NextRequest, NextResponse } from 'next/server'
import { addActivityData } from '@/lib/store'
import { importRowSchema } from '../schema'
import { ActivityType } from '@/lib/types'

// POST /api/import/json
// xlsx를 클라이언트에서 파싱 후 JSON으로 전송하는 엔드포인트
// xlsx를 서버에서 파싱하지 않는 이유:
//   1. xlsx 라이브러리가 Next.js Edge Runtime과 호환되지 않음
//   2. 바이너리 파일을 서버로 전송하면 메모리 부담
export async function POST(req: NextRequest) {
  try {
    const { rows } = await req.json()

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { success: false, error: '유효한 행 데이터가 없습니다.' },
        { status: 400 }
      )
    }

    const validRows: Array<{
      date: Date
      activityType: ActivityType
      description: string
      quantity: number
      unit: string
    }> = []
    const errors: string[] = []

    // 행 단위 Zod 유효성 검사
    rows.forEach((row, i) => {
      const result = importRowSchema.safeParse(row)
      if (result.success) {
        validRows.push({
          date:         result.data.date,
          activityType: result.data.activityType as ActivityType,
          description:  result.data.description,
          quantity:     result.data.quantity,
          unit:         result.data.unit,
        })
      } else {
        const messages = result.error.issues.map((e) => e.message).join(', ')
        errors.push(`행 ${i + 2}: ${messages}`)
      }
    })

    const added = await addActivityData(validRows)

    return NextResponse.json({
      success: true,
      data: {
        imported: added.length,
        failed:   errors.length,
        errors,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '데이터 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}