import { z } from 'zod'

const activityTypeEnum = z.enum(['electricity', 'raw_material', 'transport'])

// ─────────────────────────────────────────
// 배출계수 스키마
// ─────────────────────────────────────────

// POST /api/emission-factors 요청 바디 검증
export const emissionFactorSchema = z.object({
  category: activityTypeEnum,

  subCategory: z.string().min(1, '세부 항목은 필수입니다.'),

  factor: z.coerce
    .number()
    .positive('배출계수는 0보다 커야 합니다.'),

  unit: z.string().min(1, '단위는 필수입니다.'),

  source: z.string().min(1, '출처는 필수입니다.'),

  // 선택값 — 없으면 현재 시간으로 처리
  validFrom: z.string().optional()
    .transform((val) => val ? new Date(val) : new Date()),

  validUntil: z.string().nullable().optional()
    .transform((val) => val ? new Date(val) : null),
})

export type EmissionFactorInput = z.infer<typeof emissionFactorSchema>
