import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Search, AlertTriangle, ChevronDown, ChevronUp,
  Download, Clock, Mail, Globe, Lock, FileText, Link
} from 'lucide-react'
import { getForensics, getReportUrl } from '../lib/api'
import type { ForensicsDetail } from '../types'
import ClassificationBadge from '../components/ClassificationBadge'
import RiskScoreBar from '../components/RiskScoreBar'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { formatDate, authResultColor, severityColor } from '../lib/utils'

function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Icon size={15} className="text-blue-400" />
          {title}
        </div>
        {open ? <ChevronUp size={15} className="text-gray-500" /> : <ChevronDown size={15} className="text-gray-500" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

function KV({ label, value, mono = false, cls = '' }: { label: string; value: string; mono?: boolean; cls?: string }) {
  if (!value) return null
  return (
    <div className="flex gap-3 py-2 border-b border-white/5 last:border-0">
      <span className="text-gray-500 text-xs w-36 flex-shrink-0 mt-0.5">{label}</span>
      <span className={`text-xs flex-1 break-all ${mono ? 'font-mono text-cyan-300' : 'text-white'} ${cls}`}>{value}</span>
    </div>
  )
}

export default function ForensicsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<ForensicsDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchId, setSearchId] = useState(id || '')

  const load = async (analysisId: string) => {
    if (!analysisId) return
    setLoading(true)
    setError('')
    try {
      const d = await getForensics(Number(analysisId))
      setData(d)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Analysis not found. Run an analysis first.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) load(id)
  }, [id])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/forensics/${searchId}`)
    load(searchId)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Digital Forensics</h1>
          <p className="text-gray-400 text-sm mt-0.5">Deep-dive investigation into email metadata and routing</p>
        </div>
        {data && (
          <div className="flex gap-2">
            <a href={getReportUrl(data.id, 'json')} download className="btn-secondary text-sm py-2">
              <Download size={14} /> JSON
            </a>
            <a href={getReportUrl(data.id, 'pdf')} download className="btn-primary text-sm py-2">
              <Download size={14} /> PDF Report
            </a>
          </div>
        )}
      </div>

      {/* ID search */}
      <div className="glass-card p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1">
            <input
              className="input-field"
              placeholder="Enter analysis ID (from history or analysis result)"
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary">
            <Search size={15} /> Investigate
          </button>
        </form>
        {!id && !data && !loading && (
          <p className="text-gray-500 text-xs mt-2">
            → Run an email analysis first, then enter the ID here. Or navigate from History.
          </p>
        )}
      </div>

      {loading && <LoadingSpinner message="Loading forensic data..." />}
      {error && !loading && <ErrorMessage message={error} onRetry={() => load(searchId)} />}

      {data && !loading && (
        <div className="space-y-4 animate-slide-up">
          {/* Verdict header */}
          <div className="glass-card p-5">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <ClassificationBadge classification={data.classification} />
                  <span className={`text-sm font-medium uppercase ${severityColor(data.severity)}`}>
                    {data.severity} severity
                  </span>
                  <span className="text-gray-600 text-xs">ID #{data.id}</span>
                </div>
                <p className="text-white font-semibold">{data.subject || '(no subject)'}</p>
                <p className="text-gray-400 text-sm">{data.sender}</p>
                <p className="text-gray-600 text-xs mt-1">
                  <Clock size={11} className="inline mr-1" />
                  {formatDate(data.created_at)} · {data.analysis_mode}
                </p>
              </div>
              <div className="w-full md:w-48">
                <RiskScoreBar score={data.risk_score} size="lg" />
              </div>
            </div>
          </div>

          {/* Sender & routing */}
          <Section title="Sender & Header Information" icon={Mail}>
            <KV label="From (Display)" value={data.forensic_data.sender_display_name} />
            <KV label="From (Address)" value={data.forensic_data.sender_address} mono />
            <KV label="Reply-To" value={data.forensic_data.reply_to} mono />
            <KV label="Return-Path" value={data.forensic_data.return_path} mono />
            <KV label="Message-ID" value={data.forensic_data.message_id} mono />
            <KV label="X-Originating-IP" value={data.forensic_data.x_originating_ip} mono />
            <KV label="Recipient" value={data.recipient} />
            <KV label="Routing" value={data.forensic_data.routing_summary} />
          </Section>

          {/* Authentication */}
          <Section title="Email Authentication" icon={Lock}>
            <div className="grid grid-cols-3 gap-4 mb-3">
              {[
                { label: 'SPF', value: data.forensic_data.spf_result },
                { label: 'DKIM', value: data.forensic_data.dkim_result },
                { label: 'DMARC', value: data.forensic_data.dmarc_result },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-gray-400 text-xs mb-1">{label}</div>
                  <div className={`font-mono font-bold text-sm uppercase ${authResultColor(value)}`}>{value}</div>
                </div>
              ))}
            </div>
            <p className="text-gray-500 text-xs">{data.forensic_data.auth_note}</p>
          </Section>

          {/* Received hops */}
          {data.forensic_data.received_hops?.length > 0 && (
            <Section title="Mail Routing Hops" icon={Globe} defaultOpen={false}>
              <div className="space-y-2">
                {data.forensic_data.received_hops.map((hop, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs flex-shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-xs font-mono text-gray-300 break-all leading-relaxed">{hop}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Evidence timeline */}
          {data.evidence_timeline?.length > 0 && (
            <Section title="Evidence Timeline" icon={AlertTriangle}>
              <div className="space-y-3">
                {data.evidence_timeline.map(item => (
                  <div key={item.step} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-xs font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 uppercase">{item.category}</span>
                        <span className="text-gray-600 text-xs">weight: +{item.weight.toFixed(0)}</span>
                      </div>
                      <p className="text-white text-sm mt-0.5">{item.finding}</p>
                      {item.evidence && (
                        <p className="text-gray-500 text-xs font-mono mt-0.5 break-all">{item.evidence}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* URLs */}
          {data.extracted_urls?.length > 0 && (
            <Section title={`Extracted URLs (${data.extracted_urls.length})`} icon={Link} defaultOpen={false}>
              <div className="space-y-2">
                {data.extracted_urls.map((u, i) => (
                  <div key={i} className={`p-3 rounded-lg border text-xs ${u.is_suspicious ? 'bg-red-500/5 border-red-500/20' : 'bg-white/3 border-white/5'}`}>
                    <div className="flex items-center gap-2">
                      <span className={u.is_suspicious ? 'text-red-400' : 'text-green-400'}>
                        {u.is_suspicious ? '⚠' : '✓'}
                      </span>
                      <span className="font-mono text-cyan-300 break-all flex-1">{u.url}</span>
                      <span className="text-gray-500 flex-shrink-0">{u.domain}</span>
                    </div>
                    {u.reason && <p className="text-red-400 mt-1 ml-5">{u.reason}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Attachments */}
          {data.attachments?.length > 0 && (
            <Section title={`Attachments (${data.attachments.length})`} icon={FileText} defaultOpen={false}>
              <div className="space-y-2">
                {data.attachments.map((a, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${a.is_suspicious ? 'bg-red-500/5 border-red-500/20' : 'bg-white/3 border-white/5'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-mono">{a.filename}</span>
                      <span className={`text-xs ${a.is_suspicious ? 'text-red-400' : 'text-green-400'}`}>
                        {a.is_suspicious ? 'Suspicious' : 'Clean'}
                      </span>
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      {a.content_type} · {(a.size_bytes / 1024).toFixed(1)} KB
                    </div>
                    {a.reason && <p className="text-red-400 text-xs mt-1">{a.reason}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Raw headers */}
          {data.raw_headers && (
            <Section title="Raw Headers" icon={FileText} defaultOpen={false}>
              <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap break-all bg-black/30 rounded-lg p-4 max-h-72 overflow-y-auto">
                {data.raw_headers}
              </pre>
            </Section>
          )}

          {/* Disclaimer */}
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs text-gray-400">
            ⚠ Forensic report based on header inspection only. Authentication results (SPF/DKIM/DMARC)
            are parsed from email headers — no live DNS verification was performed.
            URL safety is assessed by pattern analysis only; no external scanning was performed.
          </div>
        </div>
      )}
    </div>
  )
}
