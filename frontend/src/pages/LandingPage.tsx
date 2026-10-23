import { useNavigate } from 'react-router-dom'
import {
  Shield, Mail, Search, AlertTriangle, CheckCircle,
  ArrowRight, Lock, Globe, ChevronRight, Zap
} from 'lucide-react'

const features = [
  {
    icon: AlertTriangle,
    title: 'Phishing Detection',
    description: 'Multi-signal analysis engine identifies phishing patterns, urgent language, and credential harvesting attempts.',
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
  },
  {
    icon: Lock,
    title: 'Sender Verification',
    description: 'Analyzes sender domains, display-name mismatches, Reply-To anomalies, and email authentication headers.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  {
    icon: Globe,
    title: 'URL Analysis',
    description: 'Extracts and examines all URLs for suspicious TLDs, deceptive anchor text, and known malicious patterns.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
  },
  {
    icon: Search,
    title: 'Digital Forensics',
    description: 'Full header parsing, routing analysis, authentication inspection, and downloadable forensic evidence reports.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
]

const workflow = [
  { step: '01', title: 'Submit Email', desc: 'Paste content, enter headers, or upload a .eml file for analysis.' },
  { step: '02', title: 'Analyze Threats', desc: 'Our detection engine runs multi-signal analysis across 5 threat categories.' },
  { step: '03', title: 'Generate Report', desc: 'Download a full forensic PDF or JSON report with all findings.' },
]

const stats = [
  { label: 'Detection Signals', value: '50+' },
  { label: 'Threat Categories', value: '5' },
  { label: 'Analysis Mode', value: 'Rule-Based' },
  { label: 'Export Formats', value: 'PDF & JSON' },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Shield size={18} className="text-blue-400" />
            </div>
            <span className="font-bold text-white">PhishGuard AI</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-secondary text-sm py-2 px-4"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/analyze')}
              className="btn-primary text-sm py-2 px-4"
            >
              Analyze Email
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center relative">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-blue-400 text-sm mb-8">
            <Zap size={13} />
            AI-Powered Email Security Platform
          </div>

          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            Detect Threats.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Investigate Emails.
            </span>
            <br />Stay Protected.
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            PhishGuard AI analyzes emails for phishing attacks, spoofed senders, malicious URLs,
            and suspicious attachments — then provides detailed digital forensic evidence.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/analyze')}
              className="btn-primary text-base py-3 px-8"
            >
              <Mail size={18} />
              Analyze an Email
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-secondary text-base py-3 px-8"
            >
              <Search size={16} />
              Explore Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="px-6 pb-12">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(({ label, value }) => (
            <div key={label} className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{value}</div>
              <div className="text-gray-500 text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">Detection Capabilities</h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            A modular pipeline that evaluates multiple threat vectors to produce a transparent, explainable risk score.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map(({ icon: Icon, title, description, color, bg }) => (
              <div key={title} className={`glass-card p-5 border ${bg} hover:scale-[1.01] transition-transform duration-200`}>
                <div className={`w-10 h-10 rounded-lg ${bg} border flex items-center justify-center mb-4`}>
                  <Icon size={18} className={color} />
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="px-6 py-16 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">How It Works</h2>
          <p className="text-gray-400 text-center mb-12">Three steps to a complete threat analysis</p>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {workflow.map(({ step, title, desc }, i) => (
              <div key={step} className="flex-1 flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg mb-4">
                  {step}
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm">{desc}</p>
                {i < workflow.length - 1 && (
                  <ChevronRight size={20} className="text-blue-500/40 hidden md:block rotate-0 mt-4 absolute" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center glass-card p-10">
          <CheckCircle size={40} className="text-blue-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Start Analyzing Now</h2>
          <p className="text-gray-400 mb-6">
            Paste email content, enter headers, or upload a .eml file. Results in seconds.
          </p>
          <button onClick={() => navigate('/analyze')} className="btn-primary mx-auto">
            <Mail size={16} />
            Open Email Analyzer
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-blue-400" />
              <span className="text-gray-400 text-sm">PhishGuard AI — Minor Project Demonstration</span>
            </div>
            <div className="text-xs text-gray-600 max-w-xl text-center">
              ⚠ Disclaimer: Automated detection may produce false positives and false negatives.
              This tool is for educational purposes. Never rely solely on automated results for security decisions.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
