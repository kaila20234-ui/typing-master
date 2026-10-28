interface TierBadgeProps {
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond'
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const tierColors = {
  'Bronze': {
    bg: 'bg-amber-600',
    text: 'text-amber-100',
    icon: '🥉',
    gradient: 'from-amber-900 to-amber-700',
  },
  'Silver': {
    bg: 'bg-slate-400',
    text: 'text-slate-100',
    icon: '⚪',
    gradient: 'from-slate-500 to-slate-400',
  },
  'Gold': {
    bg: 'bg-yellow-500',
    text: 'text-yellow-50',
    icon: '🥇',
    gradient: 'from-yellow-600 to-yellow-500',
  },
  'Platinum': {
    bg: 'bg-cyan-400',
    text: 'text-cyan-900',
    icon: '💎',
    gradient: 'from-cyan-500 to-cyan-400',
  },
  'Diamond': {
    bg: 'bg-purple-500',
    text: 'text-purple-50',
    icon: '👑',
    gradient: 'from-purple-600 to-purple-500',
  },
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base',
}

export function TierBadge({ tier, showLabel = true, size = 'md' }: TierBadgeProps) {
  const tierConfig = tierColors[tier]
  
  return (
    <div
      className={`${tierConfig.bg} ${tierConfig.text} ${sizeClasses[size]} rounded-lg font-semibold inline-flex items-center gap-1.5 whitespace-nowrap`}
    >
      <span className="text-lg">{tierConfig.icon}</span>
      {showLabel && (
        <span>{tier}</span>
      )}
    </div>
  )
}

interface TierProgressProps {
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond'
  ratingPoints: number
  nextTierPoints?: number
}

export function TierProgress({ tier, ratingPoints, nextTierPoints }: TierProgressProps) {
  const tierThresholds: Record<string, number> = {
    'Bronze': 0,
    'Silver': 1500,
    'Gold': 2500,
    'Platinum': 3500,
    'Diamond': 5000,
  }

  const currentTierMinPoints = tierThresholds[tier]
  const nextTierMinPoints = nextTierPoints || (tierThresholds[tier] + 1000)
  const progress = ((ratingPoints - currentTierMinPoints) / (nextTierMinPoints - currentTierMinPoints)) * 100

  const tierConfig = tierColors[tier]

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-300">{tier}</span>
        <span className="text-slate-400">{ratingPoints.toLocaleString()} / {nextTierMinPoints.toLocaleString()}</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${tierConfig.gradient} transition-all duration-300`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  )
}
