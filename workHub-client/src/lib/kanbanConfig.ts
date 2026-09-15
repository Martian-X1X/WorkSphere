// ── Kanban column config ────────────────────────────────────────────
export interface KanbanColumnConfig {
  id:          string
  label:       string
  color:       string          // dot + count color
  bgColor:     string          // column header bg
  borderColor: string          // column border accent
  emptyLabel:  string
}

export const KANBAN_COLUMNS: KanbanColumnConfig[] = [
  {
    id:          'Todo',
    label:       'Todo',
    color:       'text-surface-400',
    bgColor:     'bg-surface-800/50',
    borderColor: 'border-surface-700',
    emptyLabel:  'No tasks to do',
  },
  {
    id:          'InProgress',
    label:       'In Progress',
    color:       'text-blue-400',
    bgColor:     'bg-blue-950/20',
    borderColor: 'border-blue-900/50',
    emptyLabel:  'Nothing in progress',
  },
  {
    id:          'InReview',
    label:       'In Review',
    color:       'text-purple-400',
    bgColor:     'bg-purple-950/20',
    borderColor: 'border-purple-900/50',
    emptyLabel:  'Nothing in review',
  },
  {
    id:          'Done',
    label:       'Done',
    color:       'text-green-400',
    bgColor:     'bg-green-950/20',
    borderColor: 'border-green-900/50',
    emptyLabel:  'No completed tasks',
  },
  {
    id:          'Cancelled',
    label:       'Cancelled',
    color:       'text-surface-600',
    bgColor:     'bg-surface-800/30',
    borderColor: 'border-surface-800',
    emptyLabel:  'No cancelled tasks',
  },
]