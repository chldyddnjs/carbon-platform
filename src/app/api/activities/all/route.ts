import { NextResponse } from 'next/server'
import { deleteAllActivityData } from '@/lib/store'

// DELETE /api/activities/all
// 활동 데이터 전체 삭제
// 용도: 임포트 실수나 데이터 초기화 시 사용
export async function DELETE() {
  try {
    await deleteAllActivityData()
    return NextResponse.json({ success: true, message: '전체 삭제 완료' })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '전체 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}