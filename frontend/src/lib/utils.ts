import type { Classification, Severity } from '../types'

export function classificationColor(c: Classification): string {
  switch (c) {
    case 'safe': return 'text-green-400'
    case 'suspicious': return 'text-amber-400'
    case 'phishing': return 'text-red-400'
    default: return 'text-gray-400'
  }
}

export function classificationBg(c: Classification): string {
  switch (c) {
    case 'safe': return 'bg-green-500/10 border-green-500/30'
    case 'suspicious': return 'bg-amber-500/10 border-amber-500/30'
    case 'phishing': return 'bg-red-500/10 border-red-500/30'
    default: return 'bg-gray-500/10 border-gray-500/30'
  }
}

export function severityColor(s: Severity): string {
  switch (s) {
    case 'low': return 'text-green-400'
    case 'medium': return 'text-amber-400'
    case 'high': return 'text-orange-400'
    case 'critical': return 'text-red-400'
    default: return 'text-gray-400'
  }
}

export function riskScoreColor(score: number): string {
  if (score >= 70) return 'text-red-400'
  if (score >= 40) return 'text-amber-400'
  return 'text-green-400'
}

export function riskScoreBarColor(score: number): string {
  if (score >= 70) return 'bg-red-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-green-500'
}

export function classificationBadgeClass(c: Classification): string {
  switch (c) {
    case 'safe': return 'badge-safe'
    case 'suspicious': return 'badge-suspicious'
    case 'phishing': return 'badge-phishing'
    default: return 'badge-unknown'
  }
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function authResultColor(result: string): string {
  if (result === 'pass') return 'text-green-400'
  if (['fail', 'softfail'].includes(result)) return 'text-red-400'
  if (result === 'neutral') return 'text-amber-400'
  return 'text-gray-400'
}
