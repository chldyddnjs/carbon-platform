# CarbonLens — 탄소 관리 플랫폼

> GHG Protocol 기반 제품 탄소 발자국(PCF)을 측정·관리하는 SaaS 플랫폼

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)

---

## 로컬 실행 (5단계)

```bash
# 1. 레포지토리 클론
git clone https://github.com/your-username/carbon-platform.git && cd carbon-platform

# 2. 의존성 설치
yarn install

# 3. 환경변수 설정
cp .env.example .env.local

# 4. DB 실행 + 마이그레이션 + 시드
docker-compose up -d db
npx prisma migrate deploy && npm run seed

# 5. 개발 서버 시작
yarn dev
```

→ http://localhost:3000

---

## Docker로 실행 (보너스)

```bash
docker-compose up --build
```

DB 실행 → 마이그레이션 → 시드 → 앱 시작까지 자동으로 처리됩니다.

---

## 올바른 사용 순서

배출계수 등록 (/emission-factors) 또는 npm run seed
활동 데이터 임포트 (/import) 또는 수동 입력 (/data-entry)
대시보드 확인 (/)


> 배출계수가 없으면 `calculatedCO2e = null`이 되어 차트에 데이터가 표시되지 않습니다.
> 탄소 회계에서 배출량 = 활동량 × 배출계수이므로 배출계수가 반드시 먼저 등록되어야 합니다.

---

## 화면 구성

| 경로 | 설명 | 대상 |
|---|---|---|
| `/` | 메인 대시보드 (KPI, 차트, 기간 필터) | 경영자 + 실무자 |
| `/data-entry` | 활동 데이터 입력 | 실무자 |
| `/emission-factors` | 배출계수 관리 (버전 이력) | 담당자 |
| `/import` | Excel/CSV 파일 임포트 | 실무자 |

---

## 시스템 설계

### 아키텍처
```
src/
├── app/
│   ├── api/                # Next.js Route Handler (REST API)
│   │   ├── dashboard/      # GET  — 대시보드 집계
│   │   ├── activities/     # GET, POST, DELETE
│   │   ├── emission-factors/ # GET, POST, DELETE
│   │   └── import/         # POST — CSV/xlsx 임포트
│   ├── data-entry/         # 데이터 입력 페이지
│   ├── emission-factors/   # 배출계수 관리 페이지
│   ├── import/             # 파일 임포트 페이지
│   └── page.tsx            # 메인 대시보드
├── components/
│   ├── layout/             # Navigation
│   └── dashboard/          # KpiCard, MonthlyChart, ScopeChart 등
└── lib/
├── types.ts            # 도메인 타입 (GHGScope, ActivityType 등)
├── schemas.ts          # Zod 유효성 검사 스키마 (중앙 관리)
├── calculations.ts     # PCF 계산 엔진 (일/주/월/년 집계)
├── store.ts            # Prisma DB 레이어
├── db.ts               # Prisma Client 싱글톤
├── api.ts              # API 엔드포인트 중앙 관리
└── colors.ts           # 차트 전용 색상 상수
```
### 핵심 설계 결정

#### 1. store.ts와 calculations.ts 분리
store.ts        → 데이터를 어디서 가져오냐 (DB 레이어)
calculations.ts → 어떻게 계산하냐 (순수 로직)
DB를 교체해도 계산 로직은 그대로 재사용 가능합니다.

#### 2. 배출계수 버전 이력 관리
새 배출계수 등록 시 기존 계수를 삭제하지 않고 `isActive=false`로 비활성화합니다.
이유: 과거 데이터가 당시 어떤 계수로 계산됐는지 감사(audit) 추적이 가능해야 함

#### 3. xlsx 클라이언트 파싱
xlsx 파일을 서버가 아닌 브라우저에서 파싱 후 JSON으로 전송합니다.
이유: xlsx 라이브러리가 Next.js Edge Runtime과 호환되지 않음
바이너리 파일 서버 전송 시 메모리 부담

#### 4. API 엔드포인트 중앙 관리
```typescript
// src/lib/api.ts
export const API = {
  dashboard: (period: string) => `/api/dashboard?period=${period}`,
  activities: {
    list:      () => '/api/activities',
    delete:    (id: string) => `/api/activities?id=${id}`,
    deleteAll: () => '/api/activities/all',
  },
  ...
} as const
```
URL 변경 시 한 곳만 수정하면 되고 TypeScript 자동완성으로 오타를 방지합니다.

---

## ERD
```
┌──────────────────────┐      ┌──────────────────────────┐
│   ActivityData       │      │   EmissionFactor         │
├──────────────────────┤      ├──────────────────────────┤
│ id           String  │      │ id           String      │
│ date         DateTime│      │ category     String      │
│ activityType String  │      │ subCategory  String      │
│ description  String  │      │ factor       Float       │
│ quantity     Float   │  ──► │ unit         String      │
│ unit         String  │      │ source       String      │
│ scope        Int     │      │ version      Int         │
│ emissionFactor Float │      │ isActive     Boolean     │
│ calculatedCO2e Float │      │ validFrom    DateTime    │
│ createdAt    DateTime│      │ validUntil   DateTime?   │
│ updatedAt    DateTime│      │ createdAt    DateTime    │
└──────────────────────┘      └──────────────────────────┘
┌────────────────────────────┐
│   ProductCarbonFootprint   │
├────────────────────────────┤
│ id            String       │
│ productName   String       │
│ periodStart   DateTime     │
│ periodEnd     DateTime     │
│ scope1CO2e    Float        │
│ scope2CO2e    Float        │
│ scope3CO2e    Float        │
│ totalCO2e     Float        │
│ calculatedAt  DateTime     │
└────────────────────────────┘
```
---

## GHG Scope 분류

| Scope | 정의 | 이 플랫폼에서 |
|---|---|---|
| Scope 1 | 직접 배출 (자체 연소) | 미등록 |
| Scope 2 | 간접 배출 (구매 전력) | ⚡ 전기 |
| Scope 3 | 기타 간접 (공급망) | 🏗️ 원소재 + 🚛 운송 |

### PCF 계산식
배출량(kgCO₂e) = 활동량 × 배출계수
전기:   kWh × 0.456 kgCO₂e/kWh  (한국전력공사 KEPCO 2024)
원소재: kg  × {플라스틱1: 2.3, 플라스틱2: 3.2} kgCO₂e/kg (IPCC 2023)
운송:   ton-km × 3.5 kgCO₂e/ton-km  (환경부 2024)
총 PCF = Σ Scope1 + Σ Scope2 + Σ Scope3

---

## Trade-off

| 결정 | 선택 | 이유 |
|---|---|---|
| DB 레이어 | Prisma v7 | 타입 자동 생성, schema.prisma가 ERD 역할 |
| API 방식 | Next.js Route Handler | 별도 서버 없이 프론트와 한 프로젝트 관리 |
| xlsx 파싱 | 클라이언트 | Edge Runtime 비호환, 메모리 부담 |
| HTTP 클라이언트 | fetch | Next.js가 확장 제공, 별도 설치 불필요 |
| 유효성 검사 | Zod | 스키마 하나로 검사·타입·에러 메시지 처리 |

---

## API 명세

| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/api/dashboard?period=month` | 대시보드 집계 (day/week/month/year) |
| GET | `/api/activities` | 활동 데이터 목록 |
| POST | `/api/activities` | 활동 데이터 추가 |
| DELETE | `/api/activities?id=` | 활동 데이터 단건 삭제 |
| DELETE | `/api/activities/all` | 활동 데이터 전체 삭제 |
| GET | `/api/emission-factors` | 배출계수 목록 (이력 포함) |
| POST | `/api/emission-factors` | 배출계수 등록 (버전 관리) |
| DELETE | `/api/emission-factors?id=` | 배출계수 삭제 |
| POST | `/api/import` | CSV 임포트 |
| POST | `/api/import/json` | xlsx 파싱 결과 임포트 |

---

## 작업 소요 시간

| 날짜 | 작업 내용 | 소요 시간 |
|---|---|---|
| 5/6 | 도메인 분석, 설계, 아키텍처 결정, DB 스키마, API 설계 | 약 8시간 |
| 5/7 | UI 구현, 버그 수정, Docker 설정, README | 약 8시간 |
| **합계** | | **약 16시간** |

**가장 시간이 걸린 부분**
- Prisma v7 설정 (v6과 설정 방식이 완전히 달라짐 — `prisma.config.ts` 도입)
- Recharts CSS 변수 미지원 이슈 (`colors.ts`로 hex 상수 분리)
- Next.js 서버/클라이언트 번들 분리 (`serverExternalPackages` 설정)

---

## AI 도구 사용 내역

### 사용 도구
- **Claude (Anthropic)** — 설계, 코드 작성, 디버깅 전 과정

### 활용 방식
Claude가 작성한 코드를 단순히 복붙하지 않고, 아래 방식으로 진행했습니다.

1. **코드를 읽고 이해되지 않는 부분은 반드시 질문**
   - "useCallback은 왜 사용한 거지?"
   - "유효성 검사가 너무 하드코딩이야, Zod를 사용하면 좋겠어"

2. **UI를 직접 보면서 개선점 판단**
   - "삭제 버튼이 있는 게 좋을 것 같아"
   - "설명 부분이 하드코딩이라 데이터 기반으로 바꿔야 할 것 같아"

3. **공식 문서로 검증**
   - Claude의 설명이 맞는지 Prisma, Next.js, Zod 공식 문서로 직접 확인

### 주요 프롬프트 예시
| 상황 | 프롬프트 |
|---|---|
| 설계 | "GHG Protocol 기준으로 전기/원소재/운송을 Scope 분류하는 TypeScript 타입 정의해줘" |
| 리팩토링 | "유효성 검사가 너무 하드코딩이야, Zod로 바꿔줘" |
| 디버깅 | "Recharts에서 CSS 변수가 안 먹히는 이유가 뭐야?" |
| 학습 | "useCallback을 쓰는 게 좋을까 안 쓰는 게 좋을까? 차이는 없는 것 같아" |

### AI가 생성한 코드 중 직접 수정한 부분
- 배출계수 스키마 위치: API 폴더 → `lib/schemas.ts`로 통합
- GHG Protocol 설명: 하드코딩 → 개념 설명으로 변경
- 화살표 함수 vs 일반 함수 기준 정립 (컴포넌트 = 화살표, 로직 = 일반)
- `handleDelete`, `handleDeleteAll`: useCallback 제거 → 일반 함수로 변경

---

## 기술 스택

| 분류 | 기술 |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Chart | Recharts |
| ORM | Prisma v7 |
| DB | PostgreSQL 16 |
| Validation | Zod v4 |
| File Parsing | xlsx (클라이언트) |
| Container | Docker + Docker Compose |
