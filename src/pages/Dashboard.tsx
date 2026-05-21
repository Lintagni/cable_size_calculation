import { FileText, Clock, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calculation History</h1>
          <p className="text-sm text-gray-500 mt-1">Your saved cable sizing calculations</p>
        </div>
        <Link
          to="/calculator"
          className="bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800"
        >
          New Calculation
        </Link>
      </div>

      {/* Empty state */}
      <div className="bg-white border border-gray-200 rounded-xl p-16 text-center">
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-7 h-7 text-gray-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">No saved calculations yet</h2>
        <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
          Run a calculation and click "Save" to store it here. Sign in to sync across devices.
        </p>
        <Link
          to="/calculator"
          className="inline-flex items-center gap-2 bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-blue-800"
        >
          <FileText className="w-4 h-4" />
          Start a calculation
        </Link>
      </div>

      {/* Placeholder for future saved items */}
      <div className="mt-4 text-xs text-gray-400 text-center flex items-center justify-center gap-1">
        <Trash2 className="w-3 h-3" />
        History is saved locally. Sign in for cloud sync (coming soon).
      </div>
    </div>
  )
}
