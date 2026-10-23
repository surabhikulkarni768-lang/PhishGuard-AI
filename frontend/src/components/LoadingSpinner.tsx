interface Props {
  message?: string
  className?: string
}

export default function LoadingSpinner({ message = 'Loading...', className = '' }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-12 ${className}`}>
      <div className="spinner" />
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  )
}
