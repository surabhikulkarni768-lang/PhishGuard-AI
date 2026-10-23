import axios from 'axios'
import type {
  AnalysisResult,
  HistoryResponse,
  DashboardStats,
  ForensicsDetail,
} from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

export async function analyzeEmail(formData: FormData): Promise<AnalysisResult> {
  const res = await api.post<AnalysisResult>('/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export async function getHistory(params: {
  page?: number
  page_size?: number
  search?: string
  classification?: string
  sort?: string
}): Promise<HistoryResponse> {
  const res = await api.get<HistoryResponse>('/history', { params })
  return res.data
}

export async function getAnalysis(id: number): Promise<AnalysisResult> {
  const res = await api.get<AnalysisResult>(`/history/${id}`)
  return res.data
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await api.get<DashboardStats>('/dashboard/stats')
  return res.data
}

export async function getForensics(id: number): Promise<ForensicsDetail> {
  const res = await api.get<ForensicsDetail>(`/forensics/${id}`)
  return res.data
}

export function getReportUrl(id: number, fmt: 'pdf' | 'json' = 'pdf'): string {
  return `/api/report/${id}?fmt=${fmt}`
}

export default api
