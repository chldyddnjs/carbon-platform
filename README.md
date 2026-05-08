# Carbon-Platform — 탄소 관리 플랫폼

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
cp .env.example .env

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

<p> 1. 배출계수 등록 (/emission-factors) 또는 npm run seed</p>
<p> 2. 활동 데이터 임포트 (/import) 또는 수동 입력 (/data-entry)</p>
<p> 3. 대시보드 확인 (/)</p>


<p> > 배출계수가 없으면 `calculatedCO2e = null`이 되어 차트에 데이터가 표시되지 않습니다.</p>
<p> > 탄소 회계에서 배출량 = 활동량 × 배출계수이므로 배출계수가 반드시 먼저 등록되어야 합니다.</p>

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
│   ├── api/                    # Next.js Route Handle(REST API)
│   │   ├── dashboard/          # GET  — 대시보드 집계
│   │   ├── activities/         # GET, POST, DELETE
│   │   ├── emission-factors/   # GET, POST, DELETE
│   │   └── import/             # POST — CSV/xlsx 임포트
│   ├── data-entry/             # 데이터 입력 페이지
│   ├── emission-factors/       # 배출계수 관리 페이지
│   ├── import/                 # 파일 임포트 페이지
│   └── page.tsx                # 메인 대시보드
├── components/
│   ├── layout/
│   │   └── Navigation.tsx      # 공통 네비게이션
│   ├── dashboard/              # 대시보드 전용 (도메인 의존)
│   │   ├── KpiCard.tsx         # KPI 카드 + PeriodTabs
│   │   ├── PeriodChart.tsx     # 기간별 배출량 차트
│   │   ├── ScopeChart.tsx      # GHG Scope 도넛 차트
│   │   ├── ActivitySummaryTable.tsx
│   │   └── RawDataTable.tsx
│   └── ui/                     # 범용 컴포넌트 (도메인 무관)
│       ├── Badge.tsx
│       ├── ErrorMessage.tsx
│       ├── SuccessBanner.tsx
│       ├── SectionHeader.tsx
│       └── LoadingSpinner.tsx
└── lib/
    ├── types.ts                # 도메인 타입 (GHGScope, ActivityType 등)
    ├── schemas.ts              # Zod 스키마 중앙 관리
    ├── calculations.ts         # PCF 계산 엔진
    ├── store.ts                # Prisma DB 레이어
    ├── db.ts                   # Prisma Client 싱글톤
    ├── api.ts                  # API 엔드포인트 중앙 관리
    └── colors.ts               # 차트 전용 색상 상수
```

#### KpiCard 재사용 예시
```typescript
// title, value, accentColor만 바꾸면 어떤 지표든 표시 가능
<KpiCard title="총 배출량"    value="1.445 tCO₂e" accentColor="border-green-500" />
<KpiCard title="Scope 2 (전력)" value="100 kgCO₂e"  accentColor="border-blue-500" />
<KpiCard title="Scope 3 (공급망)" value="1345 kgCO₂e" accentColor="border-amber-500" />
```
### 핵심 설계 결정

#### 1. store.ts와 calculations.ts 분리
<p>store.ts        → 데이터를 어디서 가져오냐 (DB 레이어)</p>
<p>calculations.ts → 어떻게 계산하냐 (순수 로직)</p>
<p>DB를 교체해도 계산 로직은 그대로 재사용 가능합니다.</p>

#### 2. 배출계수 버전 이력 관리
<p>새 배출계수 등록 시 기존 계수를 삭제하지 않고 `isActive=false`로 비활성화합니다.</p>
<p>이유: 과거 데이터가 당시 어떤 계수로 계산됐는지 감사(audit) 추적이 가능해야 함</p>

#### 3. xlsx 클라이언트 파싱
<p>xlsx 파일을 서버가 아닌 브라우저에서 파싱 후 JSON으로 전송합니다.</p>
<p>이유: xlsx 라이브러리가 Next.js Edge Runtime과 호환되지 않음</p>
<p>바이너리 파일 서버 전송 시 메모리 부담</p>

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
```
---

## GHG Scope 분류

| Scope | 정의 | 이 플랫폼에서 |
|---|---|---|
| Scope 1 | 직접 배출 (자체 연소) | 미등록 |
| Scope 2 | 간접 배출 (구매 전력) | ⚡ 전기 |
| Scope 3 | 기타 간접 (공급망) | 🏗️ 원소재 + 🚛 운송 |

### PCF 계산식
<p>배출량(kgCO₂e) = 활동량 × 배출계수</p>
<p>전기:   kWh × 0.456 kgCO₂e/kWh  (한국전력공사 KEPCO 2024)</p>
<p>원소재: kg  × {플라스틱1: 2.3, 플라스틱2: 3.2} kgCO₂e/kg (IPCC 2023)</p>
<p>운송:   ton-km × 3.5 kgCO₂e/ton-km  (환경부 2024)</p>
<p>총 PCF = Σ Scope1 + Σ Scope2 + Σ Scope3</p>

---

## Trade-off
```
| 결정 | 선택 | 이유 |
|---|---|---|
| DB 레이어 | Prisma v7 | 타입 자동 생성, schema.prisma가 ERD 역할 |
| API 방식 | Next.js Route Handler | 별도 서버 없이 프론트와 한 프로젝트 관리 |
| xlsx 파싱 | 클라이언트 | Edge Runtime 비호환, 메모리 부담 |
| HTTP 클라이언트 | fetch | Next.js가 확장 제공, 별도 설치 불필요 |
| 유효성 검사 | Zod | 스키마 하나로 검사·타입·에러 메시지 처리 |
```
---

## API 명세
```
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
```
---

## 작업 소요 시간
```
| 날짜 | 작업 내용 | 소요 시간 |
|---|---|---|
| 5/6 | 도메인 분석, 설계, 아키텍처 결정, DB 스키마, API 설계 | 약 8시간 |
| 5/7 | UI 구현, 버그 수정, Docker 설정, README | 약 8시간 |
| **합계** | | **약 16시간** |

**가장 시간이 걸린 부분**

**1. 프로젝트 설계**
- PCF 도메인 이해 (GHG Protocol, Scope 1/2/3, 배출계수 개념)
- 프론트엔드 데이터 흐름 설계 (API 응답 → 차트 입력 타입 정의)
- 백엔드 데이터 설계 (ERD — ActivityData, EmissionFactor 관계)
- API 설계 (REST 엔드포인트 구조, 기간 필터 방식)
- UI 설계 (경영자 vs 실무자 대상 화면 구성)

**2. 생성된 코드 검토 기준**

Claude가 작성한 코드를 그대로 사용하지 않고 아래 기준으로 검토했습니다:

| 기준 | 검토 내용 |
|---|---|
| 의존성 | 꼭 필요한 라이브러리만 사용하는가 |
| 일관성 | 변수 명명 규칙·코드 스타일이 일정한가 |
| 확장성 | 나중에 기능을 추가하거나 수정하기 쉬운가 |
| 가독성 | 다른 사람이 읽기 쉬운 코드인가 |
| 구조 | 역할에 따라 코드가 적절히 분리되어 있는가 |
| 성능 | 불필요한 반복문이나 무거운 연산이 없는가 |

**3. 검토 후 수정한 내용**
- 문맥과 무관한 코드 삭제 (사용하지 않는 `ProductCarbonFootprint` 모델 제거)
- 코드 구조 최적화 (스키마 위치 통합, 엔드포인트 분리, 함수 스타일 통일)
- 중복 로직 통합 (`components/ui/` 공통 컴포넌트 분리, `lib/api.ts` URL 중앙 관리)

---

## AI 도구 사용 내역

### 사용 도구
- **Claude (Anthropic)** — 설계, 코드 작성, 디버깅 전 과정
- **Gemini (GooGle)** - 코드어시스턴트

### 활용 방식
```
Claude가 작성한 코드를 단순히 복붙하지 않고, 아래 방식으로 진행했습니다.

### 활용 방식

단순 코드 생성 도구로 사용하지 않고, 아래 방식으로 진행했습니다.

**1. 생성된 코드를 읽고 이해되지 않는 부분은 반드시 질문**
- `useCallback`의 필요성과 의존성 배열 동작 원리 파악
- 유효성 검사 하드코딩 → Zod 스키마로 전환하여 가독성·유지보수성 향상

**2. UI를 직접 보면서 개선점 직접 판단**
- GHG Protocol 설명이 하드코딩으로 고정 → 개념 설명으로 변경
- 월별 데이터만 표시 → 일/주/월/년 기간 필터 추가 요청
- 대부분의 로직이 인라인 → 모듈 기반으로 분리 (`lib/calculations.ts`, `lib/store.ts`)
- CRUD 후 전체 리렌더링으로 UX 방해 → 이전 데이터 유지하며 교체하는 방식으로 개선
- 중복 UI 패턴 발견 → `components/ui/` 공통 컴포넌트로 분리

**3. 공식 문서로 교차 검증**
- Claude의 설명이 맞는지 Prisma, Next.js, Zod 공식 문서로 직접 확인
- Prisma v7 breaking change는 공식 마이그레이션 가이드로 직접 해결

**4. Gemini — 주석 기반 코드 생성**
- 작성할 함수의 기능을 주석으로 먼저 정의 후 코드 생성
- 오타 수정 및 변수명 네이밍 보조로 코드 생산성 향상

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
