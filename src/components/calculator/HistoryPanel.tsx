import { Clock, Trash2, RotateCcw, Zap, TrendingDown, AlertTriangle, Cpu, Radio, LayoutGrid, X } from 'lucide-react'
import { useHistoryStore, type HistoryEntry, type CalcType } from '../../store/historyStore'
import clsx from 'clsx'

const TYPE_META: Record<CalcType, { label: string; icon: React.ElementType; color: string }> = {
  lv:     { label: 'LV Cable',     icon: Zap,          color: 'text-blue-500   bg-blue-100   dark:bg-blue-900/30   dark:text-blue-400'   },
  vdrop:  { label: 'Voltage Drop', icon: TrendingDown,  color: 'text-amber-500  bg-amber-100  dark:bg-amber-900/30  dark:text-amber-400'  },
  sc:     { label: 'Short Circuit',icon: AlertTriangle,  color: 'text-red-500    bg-red-100    dark:bg-red-900/30    dark:text-red-400'    },
  motor:  { label: 'Motor Cable',  icon: Cpu,           color: 'text-green-500  bg-green-100  dark:bg-green-900/30  dark:text-green-400'  },
  abc:    { label: 'ABC Cable',    icon: Radio,         color: 'text-violet-500 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400' },
  busbar: { label: 'Busbar',       icon: LayoutGrid,    color: 'text-teal-500   bg-teal-100   dark:bg-teal-900/30   dark:text-teal-400'   },
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60)    return 'Just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(ts).toLocaleDateString()
}

interface Props {
  onRestore: (type: CalcType, inputs: Record<string, unknown>) => void
}

export default function HistoryPanel({ onRestore }: Props) {
  const { entries, remove, clear } = useHistoryStore()

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 py-24">
        <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <Clock className="w-7 h-7 text-gray-400" />
        </div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">No calculations yet</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          Run any calculation and it will be saved here automatically.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Calculation History</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{entries.length} saved · stored locally in browser</p>
        </div>
        <button
          onClick={clear}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear all
        </button>
      </div>

      {/* Entries */}
      <div className="space-y-2">
        {entries.map((entry: HistoryEntry) => {
          const meta = TYPE_META[entry.type]
          const Icon = meta.icon

          return (
            <div
              key={entry.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-start gap-4 group hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
            >
              {/* Icon */}
              <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', meta.color)}>
                <Icon className="w-4 h-4" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={clsx('text-[10px] font-semibold px-1.5 py-0.5 rounded-full', meta.color)}>
                    {meta.label}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-600">{timeAgo(entry.timestamp)}</span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{entry.summary}</p>
              </div>

              {/* Actions — visible on hover */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={() => onRestore(entry.type, entry.inputs)}
                  title="Restore inputs"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => remove(entry.id)}
                  title="Delete"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
