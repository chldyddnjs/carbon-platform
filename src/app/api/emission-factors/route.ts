import { NextRequest, NextResponse } from 'next/server'
import { getEmissionFactors, addEmissionFactor } from '@/lib/store'
import { emissionFactorSchema } from './schema'

// GET /api/emission-factors
// 전체 배출계수 반환 (활성 + 비활성 이력 모두 포함)
// 비활성 이력도 포함하는 이유:
//   배출계수 관리 페이지에서 버전 이력을 보여줘야 하기 때문
export async function GET() {
  try {
    const factors = await getEmissionFactors()
    return NextResponse.json({ success: true, data: factors })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '배출계수 조회에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/emission-factors
// 새 배출계수 등록
// 핵심 동작: 같은 항목의 기존 계수는 비활성화(이력 보존) 후 새 버전 추가
// 삭제하지 않는 이유:
//   과거 데이터가 어떤 계수로 계산됐는지 감사(audit) 추적이 가능해야 함
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Zod로 유효성 검사
    const result = emissionFactorSchema.safeParse(body)

    if (!result.success) {
      const errors = result.error.issues.map((e) => e.message)
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      )
    }

    const newFactor = await addEmissionFactor({
      ...result.data,
      isActive: true,
    })

    return NextResponse.json(
      { success: true, data: newFactor },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '배출계수 저장에 실패했습니다.' },
      { status: 500 }
    )
  }
}