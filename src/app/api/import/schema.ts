import { z } from 'zod'
import { ActivityType } from '@/lib/types'

// 기존 importRowSchema 교체
export const importRowSchema = z.object({
  // 엑셀 시리얼 넘버(숫자) 또는 문자열 모두 허용
  date: z.union([z.string(), z.number()])
    .transform((val) => {
      if (typeof val === 'number') {
        // 엑셀 시리얼 넘버 → Date 변환
        return new Date((val - 25569) * 86400 * 1000)
      }
      return new Date(val)
    })
    .refine((val) => !isNaN(val.getTime()), '올바른 날짜 형식이 아닙니다.'),

  activityType: z.string().min(1, '활동 유형은 필수입니다.')
    .transform((val) => {
      const map: Record<string, ActivityType> = {
        전기: 'electricity',
        electricity: 'electricity',
        원소재: 'raw_material',
        raw_material: 'raw_material',
        운송: 'transport',
        transport: 'transport',
      }
      return map[val.trim()]
    })
    .refine((val) => val !== undefined, '알 수 없는 활동 유형입니다. 허용값: 전기, 원소재, 운송'),

  description: z.string().min(1, '설명은 필수입니다.'),

  quantity: z.coerce.number().positive('수량은 0보다 커야 합니다.'),

  unit: z.string(),
})

export type ImportRow = z.infer<typeof importRowSchema>