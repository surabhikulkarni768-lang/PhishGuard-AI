import { Shield, Code, AlertTriangle, GitBranch, Mail, CheckCircle } from 'lucide-react'

const stack = [
  { label: 'Frontend', value: 'React 18 + Vite + TypeScript + Tailwind CSS' },
  { label: 'Charts', value: 'Recharts' },
  { label: 'Icons', value: 'Lucide React' },
  { label: 'Backend', value: 'Python 3.11 + FastAPI + Pydantic v2' },
  { label: 'Database', value: 'SQLite (via SQLAlchemy async + aiosqlite)' },
  { label: 'Email Parsing', value: 'Python email module (stdlib) + tldextract' },
  { label: 'Detection', value: 'Rule-based signal pipeline (ML-ready architecture)' },
  { label: 'Reports', value: 'ReportLab (PDF) + JSON export' },
]

const limitations = [
  'Detection is rule-based — it can miss novel or highly targeted phishing emails.',
  'No live DNS verification: SPF/DKIM/DMARC results are parsed from headers only.',
  'URLs are not fetched or scanned with external threat intelligence services.',
  'Attachments are not executed or sandboxed — only filenames are inspected.',
  'No machine-learning model is currently deployed (architecture is ML-ready).',
  'False positives can occur — legitimate marketing emails may score as suspicious.',
]

const users = [
  'IT security students learning about email forensics',
  'Small business owners who want basic email threat triage',
  'Developers integrating email security into their workflow',
  'Security awareness trainers demonstrating phishing concepts',
]

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings & About</h1>
        <p className="text-gray-400 text-sm mt-0.5">Platform information, technology stack, and configuration</p>
      </div>

      {/* About */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <Shield size={26} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">PhishGuard AI</h2>
            <p className="text-gray-400 text-sm">AI-Powered Email Threat Detection & Digital Forensics Platform</p>
            <p className="text-gray-600 text-xs mt-0.5">Version 1.0.0 — Minor Project Demonstration</p>
          </div>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed">
          PhishGuard AI is a full-stack cybersecurity platform designed to detect phishing attacks, analyze
          email authentication, extract and inspect URLs, and generate detailed forensic investigation reports.
          The detection engine uses a modular, multi-signal rule-based pipeline that combines sender analysis,
          language pattern detection, URL inspection, attachment scanning, and authentication header parsing
          into a single transparent risk score. The architecture is designed to support ML model integration.
        </p>
      </div>

      {/* Tech stack */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Code size={15} className="text-blue-400" /> Technology Stack
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {stack.map(({ label, value }) => (
            <div key={label} className="flex gap-3 p-3 bg-white/5 rounded-lg">
              <span className="text-gray-500 text-xs w-24 flex-shrink-0 mt-0.5">{label}</span>
              <span className="text-white text-xs">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detection approach */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <GitBranch size={15} className="text-cyan-400" /> Detection Approach
        </h2>
        <div className="space-y-3 text-sm text-gray-300 leading-relaxed">
          <p>
            The detection engine operates as a five-stage signal pipeline. Each stage independently inspects
            a different threat surface and emits weighted signals. The total weight is then compressed using a
            diminishing-returns formula to produce a 0–100 risk score.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 my-4">
            {['Sender Analysis', 'Language Detection', 'URL Inspection', 'Attachment Scan', 'Auth Headers'].map((s, i) => (
              <div key={s} className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 text-center">
                <div className="text-blue-400 text-xs font-bold mb-0.5">{i + 1}</div>
                <div className="text-white text-xs">{s}</div>
              </div>
            ))}
          </div>
          <p>
            Classification thresholds: <span className="text-green-400">0–29</span> Safe ·{' '}
            <span className="text-amber-400">30–69</span> Suspicious ·{' '}
            <span className="text-red-400">70–100</span> Phishing.
            Auth failures (SPF/DKIM/DMARC fail) or executable attachments always trigger Phishing classification
            regardless of the base score.
          </p>
          <p className="text-gray-500 text-xs">
            To integrate a trained scikit-learn model: train on a labeled dataset (e.g., SpamAssassin, CEAS-08),
            persist with joblib, and replace or supplement the <code className="font-mono bg-white/5 px-1 rounded">_compute_score()</code> function
            in <code className="font-mono bg-white/5 px-1 rounded">detection_engine.py</code>.
          </p>
        </div>
      </div>

      {/* Limitations */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <AlertTriangle size={15} className="text-amber-400" /> Known Limitations
        </h2>
        <div className="space-y-2">
          {limitations.map(l => (
            <div key={l} className="flex items-start gap-2 text-sm text-gray-300">
              <AlertTriangle size={12} className="text-amber-400 flex-shrink-0 mt-0.5" />
              {l}
            </div>
          ))}
        </div>
      </div>

      {/* Intended users */}
      <div className="glass-card p-6 mb-6">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Mail size={15} className="text-purple-400" /> Intended Users
        </h2>
        <div className="space-y-2">
          {users.map(u => (
            <div key={u} className="flex items-start gap-2 text-sm text-gray-300">
              <CheckCircle size={12} className="text-green-400 flex-shrink-0 mt-0.5" />
              {u}
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-xl">
        <p className="text-amber-300 font-medium text-sm mb-1">⚠ Security Disclaimer</p>
        <p className="text-gray-400 text-xs leading-relaxed">
          PhishGuard AI is an automated detection tool intended for educational and demonstration purposes.
          Automated tools can produce false positives (flagging legitimate emails) and false negatives
          (missing real phishing emails). Never rely solely on this tool for security decisions.
          Do not transmit sensitive production emails through this platform unless you have configured
          appropriate privacy controls. Email content is stored locally and never sent to third-party services
          unless explicitly configured via the VIRUSTOTAL_API_KEY environment variable.
        </p>
      </div>
    </div>
  )
}
