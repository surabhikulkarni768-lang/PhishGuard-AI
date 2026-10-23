import { useState } from 'react'
import { AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'

const techniques = [
  {
    title: 'Spear Phishing',
    description: 'Targeted attacks using personal information to appear legitimate. Attackers research victims on social media to craft convincing messages.',
    indicators: ['Personalized greeting with your name', 'References to your company or colleagues', 'Seemingly internal communication', 'Unusual requests from "known" senders'],
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
  },
  {
    title: 'Brand Impersonation',
    description: 'Emails that impersonate trusted brands like PayPal, Amazon, Google, or banks to steal credentials or financial details.',
    indicators: ['Sender domain does not match the brand (e.g., paypa1.com)', 'Urgent account suspension or verification requests', 'Links pointing to non-brand domains', 'Generic greetings like "Dear Customer"'],
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  {
    title: 'CEO / Business Email Compromise',
    description: 'Attacker impersonates an executive to trick employees into transferring money or revealing sensitive information.',
    indicators: ['Urgent wire transfer requests', 'Requests to bypass normal procedures', 'Sent from free email provider (Gmail/Yahoo)', '"Reply only to me, this is confidential"'],
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
  },
  {
    title: 'Credential Harvesting',
    description: 'Fake login pages linked from phishing emails capture usernames and passwords when victims "log in".',
    indicators: ['Links to domains that look like the real service', 'Requests to "verify" or "confirm" your password', 'Lookalike URLs (arnazon.com, paypa1.com)', 'Login forms served over HTTP (not HTTPS)'],
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
  {
    title: 'Malicious Attachments',
    description: 'Attachments containing malware — executables, scripts, or macro-enabled documents that install ransomware or spyware.',
    indicators: ['Unexpected .exe, .bat, .js, .vbs, .ps1 files', 'Office documents requesting to "enable macros"', 'Password-protected ZIP files', 'Filenames like "invoice_2024.pdf.exe"'],
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
  },
]

const safetyTips = [
  { tip: 'Verify the sender\'s email address carefully — not just the display name.', icon: CheckCircle },
  { tip: 'Hover over links before clicking — check if the domain matches the claimed sender.', icon: CheckCircle },
  { tip: 'Never provide passwords, OTPs, or bank details via email, regardless of urgency.', icon: CheckCircle },
  { tip: 'When in doubt, contact the sender through a known phone number or official website.', icon: CheckCircle },
  { tip: 'Enable multi-factor authentication (MFA) on all important accounts.', icon: CheckCircle },
  { tip: 'Report suspicious emails to your IT security team — don\'t just delete them.', icon: CheckCircle },
  { tip: 'Keep your email client and browser updated to prevent exploits.', icon: CheckCircle },
  { tip: 'Do not open attachments from unknown senders, especially executable files.', icon: CheckCircle },
]

const quizItems = [
  {
    id: 1,
    subject: 'URGENT: Your PayPal account has been suspended!',
    from: 'PayPal Security <security@paypa1-verify.tk>',
    body: 'Your account will be closed in 24 hours. Click here to verify: http://paypal-verify-now.xyz',
    answer: 'phishing',
    explanation: 'Multiple red flags: suspicious .tk TLD in sender domain, urgency pressure, lookalike domain "paypa1" (not paypal), .xyz URL that doesn\'t belong to PayPal.',
  },
  {
    id: 2,
    subject: 'Your invoice #INV-2024-1234 is ready',
    from: 'billing@acme-corp.com',
    body: 'Please find your invoice attached. If you have questions, call us at 1-800-ACME. Thank you for your business.',
    answer: 'safe',
    explanation: 'Sender domain matches company name, no urgent language, no suspicious links, professional invoice format.',
  },
  {
    id: 3,
    subject: 'You have won $5,000! Claim your prize NOW',
    from: 'rewards@lucky-winner-2024.xyz',
    body: 'Congratulations! To claim your prize, provide your bank account details and social security number within 48 hours.',
    answer: 'phishing',
    explanation: 'Classic advance-fee scam: suspicious .xyz domain, prize claim for something you didn\'t enter, request for bank details and SSN, artificial urgency.',
  },
  {
    id: 4,
    subject: 'Team lunch on Friday?',
    from: 'john.doe@yourcompany.com',
    body: 'Hey, are you free for team lunch on Friday at 1pm? We\'re going to that new Italian place.',
    answer: 'safe',
    explanation: 'Internal email from company domain, no suspicious links, no sensitive data requests, casual and natural tone.',
  },
  {
    id: 5,
    subject: 'Action Required: Update your payment method',
    from: 'Amazon <noreply@amazon-order-update.ml>',
    body: 'Your Amazon Prime membership will be cancelled unless you update your payment details here: http://amz-update.ml/payment',
    answer: 'phishing',
    explanation: 'Amazon uses amazon.com, not amazon-order-update.ml. The .ml TLD is commonly used by spammers. The URL domain doesn\'t belong to Amazon.',
  },
]

function TechniqueCard({ technique }: { technique: typeof techniques[0] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`glass-card border ${technique.bg} overflow-hidden`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div>
          <h3 className={`font-semibold ${technique.color}`}>{technique.title}</h3>
          <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{technique.description}</p>
        </div>
        {open ? <ChevronUp size={15} className="text-gray-500 flex-shrink-0 ml-3" /> : <ChevronDown size={15} className="text-gray-500 flex-shrink-0 ml-3" />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3">
          <p className="text-gray-300 text-sm mb-3">{technique.description}</p>
          <p className="text-gray-500 text-xs uppercase font-medium mb-2">Key Indicators</p>
          <ul className="space-y-1.5">
            {technique.indicators.map(ind => (
              <li key={ind} className="flex items-start gap-2 text-sm text-gray-300">
                <AlertTriangle size={12} className={`${technique.color} flex-shrink-0 mt-0.5`} />
                {ind}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function QuizItem({ item }: { item: typeof quizItems[0] }) {
  const [selected, setSelected] = useState<string | null>(null)
  const isCorrect = selected === item.answer

  return (
    <div className="glass-card p-5">
      <div className="mb-3">
        <p className="text-gray-400 text-xs mb-1 font-medium">From: <span className="text-white font-mono">{item.from}</span></p>
        <p className="text-white font-medium">Subject: {item.subject}</p>
        <p className="text-gray-300 text-sm mt-2 bg-white/5 rounded-lg p-3 italic">"{item.body}"</p>
      </div>
      <p className="text-gray-400 text-sm mb-3">Is this email safe or phishing?</p>
      <div className="flex gap-3">
        {['safe', 'suspicious', 'phishing'].map(choice => (
          <button
            key={choice}
            onClick={() => setSelected(choice)}
            disabled={selected !== null}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
              selected === null
                ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                : selected === choice
                  ? isCorrect
                    ? 'bg-green-500/20 border-green-500/40 text-green-400'
                    : choice === item.answer
                      ? 'bg-green-500/20 border-green-500/40 text-green-400'
                      : 'bg-red-500/20 border-red-500/40 text-red-400'
                  : choice === item.answer
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-white/5 border-white/10 text-gray-500'
            }`}
          >
            {choice.charAt(0).toUpperCase() + choice.slice(1)}
          </button>
        ))}
      </div>
      {selected && (
        <div className={`mt-3 p-3 rounded-lg text-sm flex items-start gap-2 ${isCorrect ? 'bg-green-500/10 border border-green-500/20 text-green-300' : 'bg-red-500/10 border border-red-500/20 text-red-300'}`}>
          {isCorrect ? <CheckCircle size={14} className="flex-shrink-0 mt-0.5" /> : <XCircle size={14} className="flex-shrink-0 mt-0.5" />}
          <div>
            <p className="font-medium">{isCorrect ? 'Correct!' : `Incorrect — it's ${item.answer}`}</p>
            <p className="text-xs mt-1 opacity-80">{item.explanation}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AwarenessPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Security Awareness</h1>
        <p className="text-gray-400 text-sm mt-0.5">Learn to identify phishing emails and protect yourself</p>
      </div>

      {/* Common techniques */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-1">Common Phishing Techniques</h2>
        <p className="text-gray-400 text-sm mb-4">Click each card to learn more about the attack and its indicators</p>
        <div className="space-y-3">
          {techniques.map(t => <TechniqueCard key={t.title} technique={t} />)}
        </div>
      </section>

      {/* Red flags */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-4">How to Identify Suspicious Emails</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Suspicious sender domain', bad: 'security@paypa1-verify.tk', good: 'security@paypal.com' },
            { label: 'Display name mismatch', bad: 'PayPal <no-reply@random-mailer.xyz>', good: 'PayPal <service@paypal.com>' },
            { label: 'Misleading URL', bad: 'www.paypal-secure-login.com', good: 'www.paypal.com/login' },
            { label: 'SPF/DKIM failure', bad: 'spf=fail, dkim=fail, dmarc=fail', good: 'spf=pass, dkim=pass, dmarc=pass' },
          ].map(({ label, bad, good }) => (
            <div key={label} className="glass-card p-4">
              <p className="text-gray-400 text-xs font-medium mb-3 uppercase">{label}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded-lg">
                  <XCircle size={13} className="text-red-400 flex-shrink-0" />
                  <span className="text-red-300 text-xs font-mono break-all">{bad}</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle size={13} className="text-green-400 flex-shrink-0" />
                  <span className="text-green-300 text-xs font-mono break-all">{good}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Safety tips */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-white mb-4">Safe Email Handling Practices</h2>
        <div className="glass-card p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          {safetyTips.map(({ tip, icon: Icon }) => (
            <div key={tip} className="flex items-start gap-3">
              <Icon size={14} className="text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-gray-300 text-sm">{tip}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive quiz */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-1">Phishing Recognition Quiz</h2>
        <p className="text-gray-400 text-sm mb-5">
          Can you spot the phishing emails? Analyze each email and make your call.
        </p>
        <div className="space-y-4">
          {quizItems.map(item => <QuizItem key={item.id} item={item} />)}
        </div>
      </section>
    </div>
  )
}
