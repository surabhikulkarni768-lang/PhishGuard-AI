// Shared TypeScript types for PhishGuard AI

export type Classification = 'safe' | 'suspicious' | 'phishing' | 'unknown'
export type Severity = 'low' | 'medium' | 'high' | 'critical'

export interface DetectionSignal {
  category: string
  description: string
  weight: number
  evidence?: string
}

export interface ExtractedURL {
  url: string
  display_text: string
  domain: string
  is_suspicious: boolean
  reason: string
}

export interface AttachmentInfo {
  filename: string
  content_type: string
  size_bytes: number
  is_suspicious: boolean
  reason: string
}

export interface ForensicData {
  sender_display_name: string
  sender_address: string
  reply_to: string
  return_path: string
  received_hops: string[]
  message_id: string
  x_originating_ip: string
  spf_result: string
  dkim_result: string
  dmarc_result: string
  auth_note: string
  routing_summary: string
}

export interface AnalysisResult {
  id: number
  classification: Classification
  risk_score: number
  severity: Severity
  summary: string
  subject: string
  sender: string
  recipient: string
  signals: DetectionSignal[]
  extracted_urls: ExtractedURL[]
  attachments: AttachmentInfo[]
  forensic_data: ForensicData
  recommended_actions: string[]
  analysis_mode: string
  created_at: string | null
}

export interface HistoryItem {
  id: number
  subject: string
  sender: string
  classification: Classification
  risk_score: number
  severity: Severity
  created_at: string | null
}

export interface HistoryResponse {
  total: number
  page: number
  page_size: number
  items: HistoryItem[]
}

export interface DashboardStats {
  total: number
  safe: number
  suspicious: number
  phishing: number
  daily_stats: {
    date: string
    total: number
    safe: number
    suspicious: number
    phishing: number
  }[]
  recent_alerts: HistoryItem[]
  recent_analyses: HistoryItem[]
}

export interface ForensicsDetail extends AnalysisResult {
  raw_headers: string
  evidence_timeline: {
    step: number
    category: string
    finding: string
    evidence: string
    weight: number
  }[]
}
