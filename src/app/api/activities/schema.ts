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