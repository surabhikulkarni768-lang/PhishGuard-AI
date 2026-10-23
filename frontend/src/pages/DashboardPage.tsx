import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  Shield, Mail, AlertTriangle, CheckCircle, TrendingUp,
  Clock, ArrowRight, RefreshCw
} from 'lucide-react'
import { getDashboardStats } from '../lib/api'
import type { DashboardStats } from '../types'
import ClassificationBadge from '../components/ClassificationBadge'
import RiskScoreBar from '../components/RiskScoreBar'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { formatDate } from '../lib/utils'

const PIE_COLORS = { safe: '#22c55e', suspicious: '#f59e0b', phishing: '#ef4444' }

// Demo data shown when backend is unreachable
const DEMO_STATS: DashboardStats = {
  total: 142,
  safe: 89,
  suspicious: 31,
  phishing: 22,
  daily_stats: [
    { date: 'Jun 10', total: 18, safe: 12, suspicious: 4, phishing: 2 },
    { date: 'Jun 11', total: 22, safe: 14, suspicious: 5, phishing: 3 },
    { date: 'Jun 12', total: 15, safe: 10, suspicious: 3, phishing: 2 },
    { date: 'Jun 13', total: 28, safe: 18, suspicious: 6, phishing: 4 },
    { date: 'Jun 14', total: 19, safe: 11, suspicious: 5, phishing: 3 },
    { date: 'Jun 15', total: 20, safe: 13, suspicious: 5, phishing: 2 },
    { date: 'Jun 16', total: 20, safe: 11, suspicious: 3, phishing: 6 },
  ],
  recent_alerts: [
    { id: 1, subject: 'URGENT: Verify your PayPal account', sender: 'security@paypa1-verify.tk', classification: 'phishing', risk_score: 94, severity: 'critical', created_at: new Date().toISOString() },
    { id: 2, subject: 'Your Amazon order needs confirmation', sender: 'orders@amaz0n-deals.xyz', classification: 'phishing', risk_score: 78, severity: 'high', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 3, subject: 'Account suspended — action required', sender: 'noreply@secure-bank-alert.ml', classification: 'phishing', risk_score: 89, severity: 'critical', created_at: new Date(Date.now() - 7200000).toISOString() },
  ],
  recent_analyses: [
    { id: 1, subject: 'Monthly Newsletter June 2024', sender: 'newsletter@trusted.com', classification: 'safe', risk_score: 3, severity: 'low', created_at: new Date().toISOString() },
    { id: 2, subject: 'URGENT: Verify your PayPal account', sender: 'security@paypa1-verify.tk', classification: 'phishing', risk_score: 94, severity: 'critical', created_at: new Date(Date.now() - 1800000).toISOString() },
    { id: 3, subject: 'Your invoice #1234 is ready', sender: 'billing@company.com', classification: 'safe', risk_score: 5, severity: 'low', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 4, subject: 'Confirm your payment details', sender: 'orders@amaz0n-deals.xyz', classification: 'suspicious', risk_score: 52, severity: 'medium', created_at: new Date(Date.now() - 7200000).toISOString() },
  ],
}

function StatCard({ icon: Icon, label, value, color, subtitle }: {
  icon: React.ElementType; label: string; value: number; color: string; subtitle: string
}) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <span className="text-gray-400 text-sm">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
          <Icon size={15} />
        </div>
      </div>
      <div className="text-3xl font-bold text-white mt-1">{value.toLocaleString()}</div>
      <div className="text-xs text-gray-500">{subtitle}</div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111827] border border-white/10 rounded-lg p-3 text-xs">
        <p className="text-white font-medium mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.fill }}>{p.name}: {p.value}</p>
        ))}
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isDemo, setIsDemo] = useState(false)

  const fetchStats = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getDashboardStats()
      setStats(data)
      setIsDemo(false)
    } catch {
      setStats(DEMO_STATS)
      setIsDemo(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStats() }, [])

  if (loading) return <LoadingSpinner message="Loading dashboard..." className="mt-24" />

  const s = stats!
  const pieData = [
    { name: 'Safe', value: s.safe },
    { name: 'Suspicious', value: s.suspicious },
    { name: 'Phishing', value: s.phishing },
  ].filter(d => d.value > 0)

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Security Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">Email threat analysis overview</p>
        </div>
        <div className="flex items-center gap-3">
          {isDemo && (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs px-3 py-1.5 rounded-lg">
              Demo Data — Connect backend for live stats
            </div>
          )}
          <button onClick={fetchStats} className="btn-secondary text-sm py-2 px-4">
            <RefreshCw size={14} />
            Refresh
          </button>
          <button onClick={() => navigate('/analyze')} className="btn-primary text-sm py-2 px-4">
            <Mail size={14} />
            Analyze Email
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={TrendingUp} label="Total Analyzed" value={s.total} color="bg-blue-500/20 text-blue-400" subtitle="All time" />
        <StatCard icon={CheckCircle} label="Safe Emails" value={s.safe} color="bg-green-500/20 text-green-400" subtitle={`${s.total > 0 ? ((s.safe / s.total) * 100).toFixed(0) : 0}% of total`} />
        <StatCard icon={AlertTriangle} label="Suspicious" value={s.suspicious} color="bg-amber-500/20 text-amber-400" subtitle="Needs review" />
        <StatCard icon={Shield} label="Phishing" value={s.phishing} color="bg-red-500/20 text-red-400" subtitle="Threats blocked" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Daily bar chart */}
        <div className="glass-card p-5 lg:col-span-2">
          <h2 className="section-title">Daily Analysis (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={s.daily_stats} barGap={2}>
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="safe" name="Safe" fill="#22c55e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="suspicious" name="Suspicious" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              <Bar dataKey="phishing" name="Phishing" fill="#ef4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="glass-card p-5">
          <h2 className="section-title">Threat Distribution</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={PIE_COLORS[entry.name.toLowerCase() as keyof typeof PIE_COLORS]} />
                  ))}
                </Pie>
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent high-risk alerts */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">High-Risk Alerts</h2>
            <button onClick={() => navigate('/history')} className="text-blue-400 text-xs flex items-center gap-1 hover:text-blue-300">
              View all <ArrowRight size={12} />
            </button>
          </div>
          {s.recent_alerts.length === 0 ? (
            <div className="text-gray-500 text-sm py-4 text-center">No phishing emails detected</div>
          ) : (
            <div className="space-y-3">
              {s.recent_alerts.map(alert => (
                <div key={alert.id} className="flex items-start gap-3 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                  <AlertTriangle size={15} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{alert.subject || '(no subject)'}</p>
                    <p className="text-gray-500 text-xs truncate">{alert.sender}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-red-400 text-sm font-bold">{alert.risk_score.toFixed(0)}</div>
                    <div className="text-gray-600 text-xs">/100</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent analyses */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Recent Analyses</h2>
            <button onClick={() => navigate('/history')} className="text-blue-400 text-xs flex items-center gap-1 hover:text-blue-300">
              View all <ArrowRight size={12} />
            </button>
          </div>
          {s.recent_analyses.length === 0 ? (
            <div className="text-gray-500 text-sm py-4 text-center">No analyses yet</div>
          ) : (
            <div className="space-y-2">
              {s.recent_analyses.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2.5 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                  onClick={() => navigate(`/forensics/${item.id}`)}
                >
                  <ClassificationBadge classification={item.classification} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{item.subject || '(no subject)'}</p>
                    <p className="text-gray-500 text-xs">{formatDate(item.created_at)}</p>
                  </div>
                  <RiskScoreBar score={item.risk_score} showLabel={false} size="sm" />
                  <span className="text-gray-400 text-xs w-8 text-right">{item.risk_score.toFixed(0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
