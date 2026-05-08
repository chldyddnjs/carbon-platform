'use client'

interface ErrorMessageProps {
  message: string
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
      <span>⚠</span>
      <span>{message}</span>
    </p>
  )
}