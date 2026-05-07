// API 엔드포인트 중앙 관리
// 이유:
//   1. URL 변경 시 이 파일 하나만 수정하면 됨
//   2. TypeScript 자동완성으로 오타 방지
//   3. 엔드포인트 전체 구조를 한눈에 파악 가능
export const API = {
  // 대시보드 집계
  dashboard: (period: string) => `/api/dashboard?period=${period}`,

  // 활동 데이터
  activities: {
    list:      ()         => '/api/activities',
    create:    ()         => '/api/activities',
    delete:    (id: string) => `/api/activities?id=${id}`,
    deleteAll: ()         => '/api/activities/all',
  },

  // 배출계수
  emissionFactors: {
    list:   () => '/api/emission-factors',
    create: () => '/api/emission-factors',
  },

  // 파일 임포트
  import: {
    csv:  () => '/api/import',
    json: () => '/api/import/json',
  },
} as const //read only