/*
    용어 해설
    ActivityData: 활동 데이터 (예: 2024년 1월에 전기 100kWh 사용)
    EmissionFactor: 배출 계수 (예: 1kWh당 0.5kgCO2e)
    calculatedCO2e: 계산된 탄소 배출량 (예: 100kWh x 0.5kgCOO2e/kWh = 50kgCOO2e)
    Scope: GHG Protocol이 정의한 배출 범위
        Scope 1: 직접 배출 (예: 공장에서 발생하는 배출)
        Scope 2: 간접 배출 (예: 구매한 전기의 배출)
        Scope 3: 기타 간접 배출 (예: 공급망, 폐기물 등)
    DailyEmission: 일별 배출량 집계 (예: 2024년 1월 15일에 Scope 2에서 50kgCO_2e 배출)
    WeeklyEmission: 주별 배출량 집계 (예: 2024년 1월 1주차에 Scope 2에서 350kgCO_2e 배출)
    MonthlyEmission: 월별 배출량 집계  (예: 2024년 1월에 Scope 2에서 50kgCO_2e 배출)
    YearlyEmission: 연도별 배출량 집계  (예: 2024년에 Scope 2에서 600kgCO_2e 배출)

    ActivitySummary: 활동 유형별 집계 (예: 2024년 1월에 전기 사용으로 총 50kgCO_2e 배출)
    ScopeBreakdown: Scope별 집계 (예: 2024년 1월에 Scope 1에서 20kgCO_2e, Scope 2에서 50kgCO_2e, Scope 3에서 30kgCO_2e 배출)

    탄소 회계의 흐름

    활동 발생          배출계수 적용          결과
    (ActivityData) × (EmissionFactor) = calculatedCO2e
        ↓
    Scope 분류
        ↓
    일별/주별/월별/연도별 유형별 집계
    (DailyEmission, WeeklyEmission, MonthlyEmission, YearlyEmission, ActivitySummary, ScopeBreakdown)
        ↓
    대시보드 표시

    입력 -> 계산 -> 집계 -> 시각화의 흐름을 타입으로 정의
*/

// ─────────────────────────────────────────
// 기본 열거형 타입
// ─────────────────────────────────────────

// GHG Protocol이 정의한 배출 범위
//1: 내 공장에서 직접 태우는 것(보일러, 차량)
//2: 외부에서 사다 쓰는 전기
//3: 내가 통제 못하는 공급망 전체(원소재, 물류 등)
export type GHGScope = 1 | 2 | 3;

//이 플랫폼에서 다루는 활동 유형 3가지
//과제 데이터 기준으로 정확히 3가지만 존재
export type ActivityType = 'electricity' | 'raw_material' | 'transport'

/*
배출계수 - "1단위 활동당 얼마나 CO2가 나오냐"를 나타내는 변환 상수
예: 전기 1kwh -> 0.456 kgCO2e
버전 이력을 추적하는 이유:
 1. 배출 계수는 매년 정부에서 업데이트함
 2. 과거 데이터는 당시 계수로 계산한 값을 보존해야 감사가 가능
 3. 그래서 삭제 대신 isActive=false로 비활성화하고 이력을 남김
*/
export interface EmissionFactor {
    id: string;
    category: ActivityType; //어떤 활동 유형의 계수인지
    subCategory: string; // 세부 항목('한국전력','플라스틱1','트럭' 등)
    factor: number; // 핵심값: kgCO2e per unit
    unit: string; //factor의 분모 단위 ('kwh','kgg','ton-km')
    source: string; // 계수 출처 - 신뢰성 확보를 위해 필수(IPCC, 환경부)
    version:number; //버전 이력 추적용 - 같은 항목의 몇 번째 버전인지
    isActive: boolean; //true면 현재 사용중, false면 이전 버전 (이력 보존)
    validFrom: Date; //이 버전이 적용되기 시작한 날짜
    validUntil: Date | null; //유효기간 null이면 유효기간 무제한
    createdAt: Date;
}

/*
활동 데이터 - 실제 발생한 활동 기록
예: 2024년 1월 15일에 전기 100kWh 사용
calculatedCO2e를 스냅샷으로 저장하는 이유:
    1. 배출계수가 나중에 바뀌어도 당시 계산값을 보존해야함
    2. 재계산이 필요하면 별도 로직으로 처리
*/
export interface ActivityData {
    id: string;
    date: Date; //활동 발생 날짜
    activityType: ActivityType;
    description: string; // 세부 항목 ('한국전력', '플라스틱 1' 등)
    quantity: number //활동량 (예: 100kWh, 50kg 등)
    unit:string;
    scope:GHGScope; //자동 분류(ACTIVITY_SCOPE_MAP 기준)
    emissionFactor: number | null; //계산에 사용된 계수값 스냅샷
    emissionFactorId: string | null; //어떤 배출 계수를 썻는지 참조
    calculatedCO2e: number | null; //최종 결과: quantity x emissionFactor
    createdAt: Date;
    updatedAt: Date;
}

// ─────────────────────────────────────────
// 집계/시각화용 타입 (API 응답 → 차트 입력)
// ─────────────────────────────────────────

export interface BaseEmission {
    date: string;       // 날짜 형식은 문자열로 유지 (상세 형식은 주석 또는 타입으로 제어)
    electricity: number;
    rawMaterial: number;
    transport: number;
    total: number;      // 유형별 합계
    scope1: number;
    scope2: number;
    scope3: number;
}

export type DailyEmission = BaseEmission;
export type WeeklyEmission = BaseEmission;
export type MonthlyEmission = BaseEmission;
export type YearlyEmission = BaseEmission;

//Scop별 비중 - 도넛 차트에 사용
//percentage를 미리 계산 넣는 이유:
// 차트 컴포넌트가 계산 로직을 몰라도 되게 하기 위해
// 컴포넌트는 받은 데이터를 그리기만 하면됨
export interface ScopeBreakdown {
    scope: GHGScope;
    label: string;
    value:number; //kgCO2e
    percentage: number; //전체 대비 %
    color:string; // 차트 색상(컴포넌트가 결정하지 않고 데이터에 포함)
}

//활동 유형별 요약 - 테이블에 사용
//어떤 활동이 배출량에 가장 크게 기여하는지 한눈에 보여줌

export interface ActivitySummary {
    type: ActivityType;
    label: string //'전기','원소재','운송'
    totalQuantity: number; //kgCO2e
    unit:string
    totalCO2e: number;
    percentage: number;
    count:number // 몇 건의 데이터가 있는지
}

// ─────────────────────────────────────────
// 상수 매핑
// ─────────────────────────────────────────

/* 
GHG Protocol 기준 Scope 자동 불류
전기 -> Scope 2: 외부에서 구매한 전력은 간접 배출
원소재, 운송 -> Scope 3: 내가 통제 못하는 공급망
Scope 1이 없는 이유: 이 사업장(CT-045)는 직접 연소활동이 없음
*/
export const ACTIVITY_SCOPE_MAP: Record<ActivityType,GHGScope> = {
    electricity: 2,
    raw_material: 3,
    transport: 3,
}

export const ACTIVITY_LABELS: Record<ActivityType,string> = {
    electricity: '전기',
    raw_material: '원소재',
    transport: '운송',
}

export const SCOPE_LABELS: Record<GHGScope,string> = {
    1: 'Scope1 (직접 배출)',
    2: 'Scope2 (간접 배출)',
    3: 'Scope3 (기타 간접 배출)',
}