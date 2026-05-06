import type { Metadata } from 'next'
import './globals.css'
import { Navigation } from '@/components/layout/Navigation'

export const metadata: Metadata = {
  title: 'CarbonLens — 탄소 관리 플랫폼',
  description: '제품별 탄소 발자국(PCF)을 측정·관리·감축하는 플랫폼',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        {/* 모든 페이지 상단에 네비게이션 표시 */}
        <Navigation />
        {/* pt-16: 네비게이션 높이(64px)만큼 아래로 밀기 */}
        <main className="pt-16">
          {children}
        </main>
      </body>
    </html>
  )
}