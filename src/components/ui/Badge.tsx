'use client'

interface BadgeProps {
  label: string
  color: 'blue' | 'amber' | 'orange' | 'green' | 'slate'
}

const COLOR_MAP: Record<BadgeProps['color'], string> = {
  blue:   'bg-blue-50 text-blue-700 border-blue-200',
  amber:  'bg-amber-50 text-amber-700 border-amber-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  green:  'bg-green-50 text-green-700 border-green-200',
  slate:  'bg-slate-50 text-slate-700 border-slate-200',
}

export function Badge({ label, color }: BadgeProps) {
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-semibold border ${COLOR_MAP[color]}`}>
      {label}
    </span>
  )
}