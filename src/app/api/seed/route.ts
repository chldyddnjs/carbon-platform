import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { DEFAULT_EMISSION_FACTORS } from '@/lib/seed-data'

// GET /api/seed
// 과제 제공 기본 배출계수를 DB에 자동 삽입
// 시연 전 초기화용 — 프로덕션에서는 사용하지 않음
export async function GET() {
  try {
    // 기존 데이터 전체 삭제 후 재삽입
    // 이유: 시연 중 여러 번 실행해도 중복 없이 깔끔하게 초기화
    await prisma.activityData.deleteMany()
    await prisma.emissionFactor.deleteMany()

    // 기본 배출계수 4개 삽입
    for (const ef of DEFAULT_EMISSION_FACTORS) {
      await prisma.emissionFactor.create({
        data: {
          id:         ef.id,
          category:   ef.category,
          subCategory:ef.subCategory,
          factor:     ef.factor,
          unit:       ef.unit,
          source:     ef.source,
          version:    ef.version,
          isActive:   ef.isActive,
          validFrom:  ef.validFrom,
          validUntil: ef.validUntil,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: '배출계수 4개가 초기화되었습니다.',
      data: DEFAULT_EMISSION_FACTORS.map((ef) => ({
        category:    ef.category,
        subCategory: ef.subCategory,
        factor:      ef.factor,
        unit:        ef.unit,
      })),
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { success: false, error: '초기화에 실패했습니다.' },
      { status: 500 }
    )
  }
}