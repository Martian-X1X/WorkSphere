import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  FolderKanban,
  Plus,
  Search,
  SlidersHorizontal,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProjectCard } from '@/components/project/ProjectCard'
import { ProjectCardSkeleton } from '@/components/project/ProjectCardSkeleton'
import { CreateProjectModal } from '@/components/project/CreateProjectModal'
import { projectService } from '@/services/project.service'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/utils'

// ── Status filter tabs ─────────────────────────────────────────────
const STATUS_FILTERS = [
  { label: 'All',       value: '' },
  { label: 'Active',    value: 'Active' },
  { label: 'On Hold',   value: 'OnHold' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Archived',  value: 'Archived' },
] as const

// ── Sort options ───────────────────────────────────────────────────
const SORT_OPTIONS = [
  { label: 'Newest first',  sortBy: 'createdAt', sortDirection: 'desc' },
  { label: 'Oldest first',  sortBy: 'createdAt', sortDirection: 'asc'  },
  { label: 'Name A–Z',      sortBy: 'name',      sortDirection: 'asc'  },
  { label: 'Name Z–A',      sortBy: 'name',      sortDirection: 'desc' },
  { label: 'Due date',      sortBy: 'duedate',   sortDirection: 'asc'  },
] as const

export default function ProjectsPage() {
  const { isAdminOrOwner } = useAuthStore()

  // ── UI state ──────────────────────────────────────────────────────
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [sortIdx, setSortIdx] = useState(0)
  const [showSortMenu, setShowSortMenu] = useState(false)

  const sort = SORT_OPTIONS[sortIdx]

  // ── Query ─────────────────────────────────────────────────────────
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['projects', statusFilter, search, sort.sortBy, sort.sortDirection],
    queryFn: () =>
      projectService.getProjects({
        status: statusFilter || undefined,
        search: search || undefined,
        sortBy: sort.sortBy,
        sortDirection: sort.sortDirection,
        pageSize: 100,
      }),
    staleTime: 60 * 1000,
  })

  const projects = data?.data.data?.items ?? []
  const totalCount = data?.data.data?.totalCount ?? 0

  // ── Status counts for tabs ────────────────────────────────────────
  const { data: allData } = useQuery({
    queryKey: ['projects', '', '', 'createdAt', 'desc'],
    queryFn: () => projectService.getProjects({ pageSize: 100 }),
    staleTime: 5 * 60 * 1000,
  })

  const allProjects = allData?.data.data?.items ?? []
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { '': allProjects.length }
    allProjects.forEach((p) => {
      counts[p.status] = (counts[p.status] ?? 0) + 1
    })
    return counts
  }, [allProjects])

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">Projects</h1>
          <p className="text-surface-400 mt-1 text-sm">
            {totalCount > 0
              ? `${totalCount} project${totalCount !== 1 ? 's' : ''} in your organization`
              : 'Manage your team\'s projects'}
          </p>
        </div>

        {isAdminOrOwner() && (
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Project</span>
            <span className="sm:hidden">New</span>
          </Button>
        )}
      </div>

      {/* ── Filters bar ─────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Status tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STATUS_FILTERS.map((f) => {
            const count = statusCounts[f.value] ?? 0
            const isActive = statusFilter === f.value
            return (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap',
                  'flex items-center gap-1.5 transition-colors flex-shrink-0',
                  isActive
                    ? 'bg-primary-600/20 text-primary-400 border border-primary-700/50'
                    : 'text-surface-500 hover:text-surface-300 hover:bg-surface-800'
                )}
              >
                {f.label}
                {count > 0 && (
                  <span className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-semibold',
                    isActive
                      ? 'bg-primary-700/50 text-primary-300'
                      : 'bg-surface-700 text-surface-500'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Search + sort */}
        <div className="flex gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2
                               w-4 h-4 text-surface-500" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm',
                'transition-colors',
                showSortMenu
                  ? 'bg-surface-800 border-surface-600 text-surface-200'
                  : 'border-surface-700 bg-surface-800/50 text-surface-400 hover:border-surface-600'
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">{sort.label}</span>
            </button>

            {showSortMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSortMenu(false)}
                />
                <div className="absolute right-0 top-10 w-44 bg-surface-800
                                border border-surface-700 rounded-xl shadow-xl
                                z-20 overflow-hidden animate-fade-in">
                  {SORT_OPTIONS.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSortIdx(idx)
                        setShowSortMenu(false)
                      }}
                      className={cn(
                        'w-full px-3 py-2.5 text-sm text-left transition-colors',
                        idx === sortIdx
                          ? 'bg-primary-900/30 text-primary-300'
                          : 'text-surface-300 hover:bg-surface-700'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Refresh */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 border border-surface-700 rounded-lg text-surface-500
                       hover:text-surface-300 hover:border-surface-600
                       bg-surface-800/50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={cn(
              'w-4 h-4',
              isFetching && 'animate-spin'
            )} />
          </button>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      {isLoading ? (
        // Skeleton grid
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : projects.length > 0 ? (
        // Project card grid
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        // Empty state
        <EmptyState
          icon={FolderKanban}
          title={
            search
              ? 'No projects match your search'
              : statusFilter
              ? `No ${statusFilter.toLowerCase()} projects`
              : 'No projects yet'
          }
          description={
            search || statusFilter
              ? 'Try adjusting your filters or search terms'
              : 'Create your first project to get started'
          }
          actionLabel={
            isAdminOrOwner() && !search && !statusFilter
              ? '+ New Project'
              : undefined
          }
          onAction={
            isAdminOrOwner() && !search && !statusFilter
              ? () => setCreateModalOpen(true)
              : undefined
          }
        />
      )}

      {/* ── Create modal ─────────────────────────────────────────── */}
      <CreateProjectModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </div>
  )
}