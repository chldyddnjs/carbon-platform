'use client'

interface LoadingSpinnerProps {
  message?: string
}

export function LoadingSpinner({ message = '로딩 중…' }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-400">{message}</p>
      </div>
    </div>
  )
}