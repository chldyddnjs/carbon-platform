//Recharts는 SVG 렌더링 특성상 CSS 변수를 읽지 못함
//차트 컴포넌트에서만 이 상수를 사용하고
//나머지 UI는 모두 Tailwind 클래스를 사용
export const CHART_COLORS = {
    electricity: '#3b82f6',
    rawMaterial: '#f59e0b',
    transport: '#f97316',
    scope1: '#22c55e',
    scope2: '#3b82f6',
    scope3: '#f59e0b',
    grid: '#1e331e', //차트 그리드 선
    axisTick: '#4a6a4a',//축 레이블
    tooltipBg: '#111c11', //툴팁 배경
    tooltipBorder: '#243d24',//툴팁 테두리
} as const