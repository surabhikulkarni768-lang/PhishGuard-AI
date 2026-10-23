import { AlertTriangle } from 'lucide-react'

interface Props {
  message?: string
  onRetry?: () => void
}

export default function ErrorMessage({ message = 'Something went wrong.', onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
        <AlertTriangle size={22} className="text-red-400" />
      </div>
      <div className="text-center">
        <p className="text-white font-medium">Error</p>
        <p className="text-gray-400 text-sm mt-1">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-sm px-4 py-2">
          Try Again
        </button>
      )}
    </div>
  )
}
