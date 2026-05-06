'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/',                 label: '대시보드' },
  { href: '/data-entry',       label: '데이터 입력' },
  { href: '/emission-factors', label: '배출계수' },
  { href: '/import',           label: '파일 임포트' },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 shadow-sm">

      {/* 로고 */}
      <Link href="/" className="flex items-center gap-2 no-underline">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold bg-green-600 text-white">
          C
        </div>
        <span className="font-bold text-base text-slate-900">
          Carbon<span className="text-green-600">Lens</span>
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold ml-1 bg-slate-100 text-slate-500 border border-slate-200">
          CT-045
        </span>
      </Link>

      {/* 네비게이션 링크 */}
      <div className="flex items-center gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all no-underline ${
                isActive
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'text-slate-600 hover:bg-slate-100 border border-transparent'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </div>

      {/* 우측 상태 표시 */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs text-slate-400">실시간 동기화</span>
      </div>

    </nav>
  )
}