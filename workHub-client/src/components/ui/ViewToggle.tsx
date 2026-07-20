import { LayoutList, LayoutDashboard } from 'lucide-react'
import { cn } from '@/utils'

export type ViewMode = 'list' | 'board'

interface ViewToggleProps {
  view:     ViewMode
  onChange: (view: ViewMode) => void
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center bg-surface-800 border border-surface-700
                    rounded-lg p-0.5">
      {([ 
        { mode: 'list'  as ViewMode, icon: LayoutList,      label: 'List'  },
        { mode: 'board' as ViewMode, icon: LayoutDashboard, label: 'Board' },
      ]).map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          title={`${label} view`}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm',
            'transition-all font-medium',
            view === mode
              ? 'bg-surface-700 text-surface-100 shadow-sm'
              : 'text-surface-500 hover:text-surface-300'
          )}
        >
          <Icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}