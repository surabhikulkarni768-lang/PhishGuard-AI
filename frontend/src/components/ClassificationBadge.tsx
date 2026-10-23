import type { Classification } from '../types'
import { classificationBadgeClass } from '../lib/utils'

interface Props {
  classification: Classification
  size?: 'sm' | 'md'
}

const LABELS: Record<Classification, string> = {
  safe: 'Safe',
  suspicious: 'Suspicious',
  phishing: 'Phishing',
  unknown: 'Unknown',
}

export default function ClassificationBadge({ classification, size = 'md' }: Props) {
  return (
    <span className={`${classificationBadgeClass(classification)} ${size === 'sm' ? 'text-[10px] px-2 py-0.5' : ''}`}>
      {LABELS[classification] || classification}
    </span>
  )
}
