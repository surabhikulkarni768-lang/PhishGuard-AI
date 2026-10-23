import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronUp, ChevronDown, ExternalLink, Clock } from 'lucide-react'
import { getHistory } from '../lib/api'
import type { HistoryItem, Classification } from '../types'
import ClassificationBadge from '../components/ClassificationBadge'
import RiskScoreBar from '../components/RiskScoreBar'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { formatDate } from '../lib/utils'

const PAGE_SIZE = 15

export default function HistoryPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<HistoryItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [classification, setClassification] = useState<'all' | Classification>('all')
  const [sort, setSort] = useState<'desc' | 'asc'>('desc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetch = useCallback(async (p: number = page) => {
    setLoading(true)
    setError('')
    try {
      const data = await getHistory({
        page: p, page_size: PAGE_SIZE,
        search, classification, sort,
      })
      setItems(data.items)
      setTotal(data.total)
      setPage(p)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load history. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }, [page, search, classification, sort])

  useEffect(() => { fetch(1) }, [search, classification, sort])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Analysis History</h1>
        <p className="text-gray-400 text-sm mt-0.5">{total.toLocaleString()} email{total !== 1 ? 's' : ''} analyzed</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-5 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="flex-1 min-w-48 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            className="input-field pl-9"
            placeholder="Search by subject or sender..."
            value={search}
            onChange={e => { setSearch(e.target.value) }}
          />
        </div>

        {/* Classification filter */}
        <select
          className="input-field w-auto bg-[#0d1530] cursor-pointer"
          value={classification}
          onChange={e => setClassification(e.target.value as any)}
        >
          <option value="all">All Classifications</option>
          <option value="safe">Safe</option>
          <option value="suspicious">Suspicious</option>
          <option value="phishing">Phishing</option>
        </select>

        {/* Sort */}
        <button
          onClick={() => setSort(s => s === 'desc' ? 'asc' : 'desc')}
          className="btn-secondary text-sm py-2 px-4"
        >
          {sort === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          {sort === 'desc' ? 'Newest' : 'Oldest'}
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner message="Loading history..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={() => fetch(1)} />
      ) : items.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Clock size={36} className="text-gray-600 mx-auto mb-3" />
          <p className="text-white font-medium">No analyses found</p>
          <p className="text-gray-500 text-sm mt-1">
            {search || classification !== 'all' ? 'Try adjusting your filters.' : 'Analyze an email to see results here.'}
          </p>
        </div>
      ) : (
        <>
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Subject</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Sender</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Date</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Classification</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-4 py-3 w-36">Risk Score</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${idx % 2 === 0 ? '' : 'bg-white/[0.02]'}`}
                    onClick={() => navigate(`/forensics/${item.id}`)}
                  >
                    <td className="px-4 py-3">
                      <p className="text-white text-sm max-w-xs truncate">{item.subject || '(no subject)'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-300 text-xs truncate max-w-[180px]">{item.sender || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-400 text-xs whitespace-nowrap">{formatDate(item.created_at)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <ClassificationBadge classification={item.classification} />
                    </td>
                    <td className="px-4 py-3 w-36">
                      <div className="flex items-center gap-2">
                        <RiskScoreBar score={item.risk_score} showLabel={false} size="sm" />
                        <span className="text-gray-400 text-xs w-8">{item.risk_score.toFixed(0)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/forensics/${item.id}`) }}
                        className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                      >
                        <ExternalLink size={12} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-gray-500 text-xs">
                Page {page} of {totalPages} · {total} results
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetch(page - 1)}
                  disabled={page <= 1}
                  className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => fetch(page + 1)}
                  disabled={page >= totalPages}
                  className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
