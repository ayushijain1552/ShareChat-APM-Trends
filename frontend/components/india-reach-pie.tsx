'use client'

import { cn } from '@/lib/utils'

interface IndiaReachPieProps {
  percent: number
  size?: number
  className?: string
}

export function IndiaReachPie({ percent, size = 72, className }: IndiaReachPieProps) {
  const value = Math.min(89.9, Math.max(0, percent))
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div
      className={cn('relative flex flex-col items-center shrink-0', className)}
      role="img"
      aria-label={`${value.toFixed(1)} percent of Indian population reached`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-primary"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-sm font-bold text-foreground leading-none">
          {value.toFixed(1)}%
        </span>
        <span className="text-[9px] text-muted-foreground mt-0.5 text-center px-1">
          of India
        </span>
      </div>
    </div>
  )
}
