import { z } from 'zod'

// ─────────────────────────────────────────
// 공통 열거형
// ─────────────────────────────────────────

// ActivityType 허용값 — API 입력값 검증에 사용
const activityTypeEnum = z.enum(['electricity', 'raw_material', 'transport'])

// ─────────────────────────────────────────
// 활동 데이터 스키마
// ─────────────────────────────────────────

// POST /api/activities 요청 바디 검증
export const activitySchema = z.object({
  // 날짜 문자열을 받아서 유효한 날짜인지 확인 후 Date로 변환
  date: z.string()
    .min(1, '날짜는 필수입니다.')
    .refine((val) => !isNaN(Date.parse(val)), '올바른 날짜 형식이 아닙니다.')
    .transform((val) => new Date(val)),

  activityType: activityTypeEnum,

  description: z.string().min(1, '설명은 필수입니다.'),

  // coerce: 문자열로 와도 숫자로 자동 변환 후 검증
  quantity: z.coerce
    .number()
    .positive('수량은 0보다 커야 합니다.'),

  unit: z.string().min(1, '단위는 필수입니다.'),
})

// z.infer로 스키마에서 TypeScript 타입 자동 추론
// 타입을 별도로 정의할 필요 없음 — 스키마가 곧 타입
export type ActivityInput = z.infer<typeof activitySchema>

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

// ─────────────────────────────────────────
// 임포트 스키마
// ─────────────────────────────────────────

// POST /api/import/json 요청 바디 검증 (행 단위)
// date가 엑셀 시리얼 넘버(숫자) 또는 문자열로 올 수 있어서 union 사용
export const importRowSchema = z.object({
  date: z.union([z.string(), z.number()]),
  activityType: z.string().min(1, '활동 유형은 필수입니다.'),
  description: z.string().min(1, '설명은 필수입니다.'),
  quantity: z.coerce.number().positive('수량은 0보다 커야 합니다.'),
  unit: z.string(),
})

export type ImportRow = z.infer<typeof importRowSchema>