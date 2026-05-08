'use client'

interface SuccessBannerProps {
  message: string
}

export function SuccessBanner({ message }: SuccessBannerProps) {
  return (
    <div className="px-4 py-3 rounded-xl text-sm font-medium bg-green-50 text-green-700 border border-green-200 animate-fade-in">
      {message}
    </div>
  )
}