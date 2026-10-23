import { riskScoreBarColor, riskScoreColor } from '../lib/utils'

interface Props {
  score: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function RiskScoreBar({ score, showLabel = true, size = 'md' }: Props) {
  const barHeight = size === 'lg' ? 'h-3' : size === 'sm' ? 'h-1.5' : 'h-2'
  const textSize = size === 'lg' ? 'text-3xl font-bold' : 'text-sm font-semibold'

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-gray-400">Risk Score</span>
          <span className={`${textSize} ${riskScoreColor(score)}`}>{score.toFixed(0)}/100</span>
        </div>
      )}
      <div className={`w-full bg-white/5 rounded-full ${barHeight} overflow-hidden`}>
        <div
          className={`${barHeight} rounded-full transition-all duration-700 ${riskScoreBarColor(score)}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  )
}
