import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Mail, Upload, Send,
  AlertTriangle, CheckCircle, ExternalLink,
  FileText, Link, User, Lock, Info, Search, Download
} from 'lucide-react'
import { analyzeEmail, getReportUrl } from '../lib/api'
import type { AnalysisResult } from '../types'
import ClassificationBadge from '../components/ClassificationBadge'
import RiskScoreBar from '../components/RiskScoreBar'
import { formatDate, classificationBg, classificationColor, severityColor, authResultColor } from '../lib/utils'

type Tab = 'content' | 'headers' | 'file'

const SAMPLE_PHISHING = `From: PayPal Security <security@paypa1-verify.tk>
To: victim@example.com
Subject: URGENT: Your PayPal account has been suspended!
Reply-To: collect@suspicious-harvester.xyz
Authentication-Results: spf=fail; dkim=fail; dmarc=fail

URGENT ACTION REQUIRED: Your PayPal account has been suspended.

Please verify your account immediately or it will be PERMANENTLY CLOSED within 24 hours.

Click here: http://paypal-secure-verify.xyz/login

Provide your password, credit card number and bank account details to restore access.`

const SAMPLE_SAFE = `From: Newsletter <newsletter@trusted-company.com>
To: user@example.com
Subject: Your monthly newsletter - June 2024
Authentication-Results: spf=pass; dkim=pass; dmarc=pass

Hello,

Here is your monthly newsletter from Trusted Company.

This month's highlights:
- New product launches
- Company news

Visit our website at https://www.trusted-company.com for more information.

Best regards,
The Newsletter Team`

function SignalRow({ signal }: { signal: AnalysisResult['signals'][0] }) {
  const catColors: Record<string, string> = {
    sender: 'text-purple-400 bg-purple-500/10',
    language: 'text-amber-400 bg-amber-500/10',
    url: 'text-red-400 bg-red-500/10',
    attachment: 'text-orange-400 bg-orange-500/10',
    authentication: 'text-blue-400 bg-blue-500/10',
    header: 'text-cyan-400 bg-cyan-500/10',
    content: 'text-pink-400 bg-pink-500/10',
  }
  const color = catColors[signal.category] || 'text-gray-400 bg-gray-500/10'

  return (
    <div className="flex items-start gap-3 p-3 bg-white/3 rounded-lg border border-white/5">
      <span className={`text-xs font-medium px-2 py-0.5 rounded ${color} flex-shrink-0 mt-0.5`}>
        {signal.category}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm">{signal.description}</p>
        {signal.evidence && (
          <p className="text-gray-500 text-xs mt-0.5 font-mono truncate">{signal.evidence}</p>
        )}
      </div>
      <div className="text-gray-400 text-xs flex-shrink-0 font-mono">+{signal.weight.toFixed(0)}</div>
    </div>
  )
}

export default function AnalyzePage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('content')
  const [rawContent, setRawContent] = useState('')
  const [sender, setSender] = useState('')
  const [subject, setSubject] = useState('')
  const [headersText, setHeadersText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [showRaw, setShowRaw] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    const fd = new FormData()
    fd.append('raw_content', rawContent)
    fd.append('sender', sender)
    fd.append('subject', subject)
    fd.append('headers_text', headersText)
    if (file) fd.append('file', file)

    try {
      const data = await analyzeEmail(fd)
      setResult(data)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to connect to analysis backend. Is the server running?')
    } finally {
      setLoading(false)
    }
  }

  const handleLoadSample = (type: 'phishing' | 'safe') => {
    setTab('content')
    setRawContent(type === 'phishing' ? SAMPLE_PHISHING : SAMPLE_SAFE)
  }

  const authColor = (v: string) => authResultColor(v)

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Email Analyzer</h1>
        <p className="text-gray-400 text-sm mt-0.5">Submit email content, headers, or a .eml file for AI-powered threat analysis</p>
      </div>

      {/* Analysis Form */}
      {!result && (
        <div className="glass-card p-6 mb-6">
          {/* Quick samples */}
          <div className="flex items-center gap-3 mb-5 pb-5 border-b border-white/5">
            <span className="text-gray-500 text-xs">Quick test:</span>
            <button onClick={() => handleLoadSample('phishing')} className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors">
              Load Phishing Sample
            </button>
            <button onClick={() => handleLoadSample('safe')} className="text-xs bg-green-500/10 border border-green-500/20 text-green-400 px-3 py-1.5 rounded-lg hover:bg-green-500/20 transition-colors">
              Load Safe Sample
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Tabs */}
            <div className="flex gap-1 mb-5 bg-white/5 rounded-lg p-1">
              {[
                { id: 'content', icon: Mail, label: 'Email Content' },
                { id: 'headers', icon: FileText, label: 'Headers Only' },
                { id: 'file', icon: Upload, label: 'Upload .eml' },
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id as Tab)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                    tab === id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {/* Content tab */}
            {tab === 'content' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Sender Email</label>
                    <input
                      className="input-field"
                      placeholder="sender@example.com"
                      value={sender}
                      onChange={e => setSender(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Subject</label>
                    <input
                      className="input-field"
                      placeholder="Email subject line"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    Raw Email Content <span className="text-gray-600">(paste full raw email or just the body)</span>
                  </label>
                  <textarea
                    className="input-field font-mono text-xs leading-relaxed resize-none"
                    rows={12}
                    placeholder="Paste the complete raw email content here (including headers if available)..."
                    value={rawContent}
                    onChange={e => setRawContent(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Headers tab */}
            {tab === 'headers' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Email Headers</label>
                  <textarea
                    className="input-field font-mono text-xs leading-relaxed resize-none"
                    rows={14}
                    placeholder="Paste the full email headers here&#10;From: ...&#10;To: ...&#10;Subject: ...&#10;Authentication-Results: ..."
                    value={headersText}
                    onChange={e => setHeadersText(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* File tab */}
            {tab === 'file' && (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Upload .eml File</label>
                <div
                  className="border-2 border-dashed border-white/10 rounded-xl p-10 text-center hover:border-blue-500/50 transition-colors cursor-pointer"
                  onClick={() => fileRef.current?.click()}
                >
                  {file ? (
                    <div className="flex flex-col items-center gap-2">
                      <FileText size={32} className="text-blue-400" />
                      <p className="text-white font-medium">{file.name}</p>
                      <p className="text-gray-500 text-xs">{(file.size / 1024).toFixed(1)} KB</p>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setFile(null) }}
                        className="text-red-400 text-xs mt-1 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload size={32} className="text-gray-600" />
                      <p className="text-white">Drop a .eml file here or click to browse</p>
                      <p className="text-gray-500 text-xs">Max 5 MB · RFC 2822 email files</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".eml,message/rfc822,text/plain"
                  className="hidden"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
                <AlertTriangle size={15} />
                {error}
              </div>
            )}

            {/* Submit */}
            <div className="mt-5 flex justify-end">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? (
                  <><div className="spinner w-4 h-4" /><span>Analyzing...</span></>
                ) : (
                  <><Send size={15} /><span>Analyze Email</span></>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="glass-card p-10 text-center animate-fade-in">
          <div className="spinner mx-auto mb-4" style={{ width: 40, height: 40, borderWidth: 3 }} />
          <p className="text-white font-medium">Analyzing email...</p>
          <p className="text-gray-400 text-sm mt-1">Running threat detection pipeline</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="animate-slide-up space-y-5">
          {/* Back / New analysis */}
          <div className="flex items-center justify-between">
            <button onClick={() => setResult(null)} className="btn-secondary text-sm py-2">
              ← New Analysis
            </button>
            <div className="flex gap-2">
              <a href={getReportUrl(result.id, 'json')} download className="btn-secondary text-sm py-2">
                <Download size={14} /> JSON
              </a>
              <a href={getReportUrl(result.id, 'pdf')} download className="btn-secondary text-sm py-2">
                <Download size={14} /> PDF Report
              </a>
              <button onClick={() => navigate(`/forensics/${result.id}`)} className="btn-primary text-sm py-2">
                <Search size={14} /> Full Forensics
              </button>
            </div>
          </div>

          {/* Verdict card */}
          <div className={`glass-card p-6 border ${classificationBg(result.classification)}`}>
            <div className="flex flex-col md:flex-row md:items-center gap-5">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <ClassificationBadge classification={result.classification} />
                  <span className={`text-sm font-medium uppercase ${severityColor(result.severity)}`}>
                    {result.severity} severity
                  </span>
                </div>
                <h2 className={`text-2xl font-bold ${classificationColor(result.classification)}`}>
                  {result.classification === 'phishing' ? '⚠ Phishing Detected' :
                   result.classification === 'suspicious' ? '⚡ Suspicious Email' : '✓ Email Appears Safe'}
                </h2>
                <p className="text-gray-300 text-sm mt-2 leading-relaxed">{result.summary}</p>
                <p className="text-gray-500 text-xs mt-2">
                  Mode: <span className="text-gray-400">{result.analysis_mode}</span> ·
                  Analyzed: <span className="text-gray-400">{formatDate(result.created_at)}</span>
                </p>
              </div>
              <div className="w-full md:w-48">
                <RiskScoreBar score={result.risk_score} size="lg" />
              </div>
            </div>
          </div>

          {/* Metadata + Auth row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Sender info */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><User size={14} className="text-blue-400" />Sender Analysis</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subject</span>
                  <span className="text-white text-right max-w-[60%] truncate">{result.subject || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sender</span>
                  <span className="text-white text-right max-w-[60%] truncate">{result.sender || '—'}</span>
                </div>
                {result.forensic_data.sender_display_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Display Name</span>
                    <span className="text-white text-right max-w-[60%] truncate">{result.forensic_data.sender_display_name}</span>
                  </div>
                )}
                {result.forensic_data.reply_to && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Reply-To</span>
                    <span className="text-white text-right max-w-[60%] truncate">{result.forensic_data.reply_to}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Auth results */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Lock size={14} className="text-blue-400" />Authentication Headers</h3>
              <div className="space-y-2">
                {[
                  { label: 'SPF', value: result.forensic_data.spf_result },
                  { label: 'DKIM', value: result.forensic_data.dkim_result },
                  { label: 'DMARC', value: result.forensic_data.dmarc_result },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">{label}</span>
                    <span className={`text-sm font-mono font-semibold uppercase ${authColor(value)}`}>{value}</span>
                  </div>
                ))}
                <p className="text-gray-600 text-xs mt-2">{result.forensic_data.auth_note}</p>
              </div>
            </div>
          </div>

          {/* Detection signals */}
          {result.signals.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="section-title flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-400" />
                Detection Signals ({result.signals.length})
              </h3>
              <div className="space-y-2">
                {result.signals.map((s, i) => <SignalRow key={i} signal={s} />)}
              </div>
            </div>
          )}

          {/* URLs */}
          {result.extracted_urls.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="section-title flex items-center gap-2">
                <Link size={15} className="text-blue-400" />
                Extracted URLs ({result.extracted_urls.length})
              </h3>
              <div className="space-y-2">
                {result.extracted_urls.map((u, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${u.is_suspicious ? 'bg-red-500/5 border-red-500/20' : 'bg-white/3 border-white/5'}`}>
                    <ExternalLink size={13} className={u.is_suspicious ? 'text-red-400' : 'text-gray-400'} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-mono truncate">{u.url}</p>
                      {u.reason && <p className="text-red-400 text-xs mt-0.5">{u.reason}</p>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${u.is_suspicious ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                      {u.is_suspicious ? 'Suspicious' : 'Clean'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          {result.attachments.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="section-title flex items-center gap-2">
                <FileText size={15} className="text-purple-400" />
                Attachments ({result.attachments.length})
              </h3>
              <div className="space-y-2">
                {result.attachments.map((a, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${a.is_suspicious ? 'bg-red-500/5 border-red-500/20' : 'bg-white/3 border-white/5'}`}>
                    <FileText size={14} className={a.is_suspicious ? 'text-red-400' : 'text-gray-400'} />
                    <div className="flex-1">
                      <p className="text-white text-sm font-mono">{a.filename}</p>
                      <p className="text-gray-500 text-xs">{a.content_type} · {(a.size_bytes / 1024).toFixed(1)} KB</p>
                      {a.reason && <p className="text-red-400 text-xs">{a.reason}</p>}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${a.is_suspicious ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                      {a.is_suspicious ? 'Suspicious' : 'Clean'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended actions */}
          {result.recommended_actions.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="section-title flex items-center gap-2">
                <CheckCircle size={15} className="text-green-400" />
                Recommended Actions
              </h3>
              <div className="space-y-2">
                {result.recommended_actions.map((rec, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-blue-400 flex-shrink-0 mt-0.5">→</span>
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-start gap-3">
            <Info size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-gray-400 text-xs leading-relaxed">
              This analysis was performed by an automated rule-based detection system. It may produce false positives
              and false negatives. Do not take irreversible actions based solely on this report. Consult a security
              professional for high-stakes decisions.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
