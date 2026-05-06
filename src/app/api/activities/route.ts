import { NextRequest, NextResponse } from 'next/server'
import { getActivityData, addActivityData, deleteActivityData } from '@/lib/store'
import { activitySchema } from './schema'

// GET /api/activities
// 전체 활동 데이터 목록 반환
export async function GET() {
  try {
    const data = getActivityData()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '데이터를 불러오는 데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/activities
// 새 활동 데이터 추가
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Zod로 유효성 검사
    // safeParse: 실패해도 예외를 던지지 않고 결과 객체로 반환
    // parse와 달리 try-catch 없이 error 처리 가능
    const result = activitySchema.safeParse(body)

    if (!result.success) {
      // Zod 에러를 사람이 읽기 좋은 메시지 배열로 변환
      const errors = result.error.issues.map((e) => e.message)
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      )
    }

    // result.data는 이미 검증 + 변환된 값
    // date는 문자열 → Date로, quantity는 문자열 → number로 자동 변환됨
    const added = addActivityData([result.data])

    return NextResponse.json(
      { success: true, data: added[0] },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '데이터 저장에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE /api/activities?id=xxx
// 활동 데이터 삭제
// id를 query string으로 받는 이유:
//   REST 관례상 DELETE는 body 없이 URL로 대상을 특정하는 것이 표준
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const deleted = deleteActivityData(id)

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: '해당 항목을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}