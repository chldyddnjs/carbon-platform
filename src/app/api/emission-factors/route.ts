import { NextRequest, NextResponse } from 'next/server'
import { getEmissionFactors, addEmissionFactor } from '@/lib/store'
import { emissionFactorSchema } from '@/lib/schemas'
import { prisma } from '@/lib/db'

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


// DELETE /api/emission-factors?id=xxx
// 배출계수 삭제
// 연결된 활동 데이터가 있으면 삭제 불가
// 이유: 과거 데이터의 계산 근거가 사라지면 감사(audit) 추적 불가
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

    // 연결된 활동 데이터가 있는지 확인
    const linkedCount = await prisma.activityData.count({
      where: { emissionFactorId: id },
    })

    if (linkedCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `이 배출계수를 사용하는 활동 데이터가 ${linkedCount}건 있습니다. 먼저 활동 데이터를 삭제해주세요.`,
        },
        { status: 409 }
      )
    }

    // 삭제 실행
    await prisma.emissionFactor.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}