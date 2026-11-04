import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FolderKanban, ListTodo, Search, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { searchService } from '@/services/search.service'
import { getApiError } from '@/utils'

export const OPEN_SEARCH_EVENT = 'worksphere:open-search'

export function GlobalSearch() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setDebouncedQuery('')
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (open) {
          close()
        } else {
          setOpen(true)
        }
      }
    }
    const onOpenEvent = () => setOpen(true)

    document.addEventListener('keydown', onKeyDown)
    window.addEventListener(OPEN_SEARCH_EVENT, onOpenEvent)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpenEvent)
    }
  }, [open, close])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => clearTimeout(timer)
  }, [query])

  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchService.search(debouncedQuery),
    enabled: open && debouncedQuery.length >= 2,
    staleTime: 30 * 1000,
    select: (res) => res.data.data,
  })

  const projects = data?.projects ?? []
  const tasks = data?.tasks ?? []
  const hasResults = projects.length > 0 || tasks.length > 0

  const goTo = (path: string) => {
    close()
    navigate(path)
  }

  return (
    <Modal open={open} onClose={close} title="Search" size="lg">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2
                             w-4 h-4 text-surface-500" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects and tasks..."
            className="input-field pl-9"
          />
          {isFetching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2
                                w-4 h-4 text-surface-500 animate-spin" />
          )}
        </div>

        {debouncedQuery.length < 2 ? (
          <p className="text-sm text-surface-500 text-center py-6">
            Type at least 2 characters to search.
          </p>
        ) : isError ? (
          <p className="text-sm text-red-400 text-center py-6">
            {getApiError(error)}
          </p>
        ) : !isFetching && !hasResults ? (
          <p className="text-sm text-surface-500 text-center py-6">
            No results for "{debouncedQuery}".
          </p>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto space-y-5">
            {projects.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-surface-500 uppercase
                              tracking-wide px-1">
                  Projects
                </p>
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => goTo(`/projects/${project.id}`)}
                    className="w-full flex items-center gap-3 px-3 py-2.5
                               rounded-lg text-left hover:bg-surface-800
                               transition-colors"
                  >
                    <FolderKanban className="w-4 h-4 text-primary-400 flex-shrink-0" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-surface-100 truncate">
                        {project.name}
                      </span>
                      <span className="block text-xs text-surface-500">
                        {project.status} · {project.taskCount} task
                        {project.taskCount === 1 ? '' : 's'}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {tasks.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-surface-500 uppercase
                              tracking-wide px-1">
                  Tasks
                </p>
                {tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => goTo(`/tasks/${task.id}`)}
                    className="w-full flex items-center gap-3 px-3 py-2.5
                               rounded-lg text-left hover:bg-surface-800
                               transition-colors"
                  >
                    <ListTodo className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-surface-100 truncate">
                        {task.title}
                      </span>
                      <span className="block text-xs text-surface-500 truncate">
                        {task.projectName} · {task.status} · {task.priority}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <p className="text-xs text-surface-600 text-center pt-1">
          Press <kbd className="px-1.5 py-0.5 bg-surface-800 rounded">Ctrl</kbd>+
          <kbd className="px-1.5 py-0.5 bg-surface-800 rounded">K</kbd> to toggle
        </p>
      </div>
    </Modal>
  )
}
