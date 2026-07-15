import { useQuery } from '@tanstack/react-query'
import { organizationService } from '@/services/organization.service'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/utils'

interface AssigneeSelectProps {
  value: string
  onChange: (userId: string) => void
  error?: string
}

export function AssigneeSelect({ value, onChange, error }: AssigneeSelectProps) {
  const { data } = useQuery({
    queryKey: ['members'],
    queryFn: () => organizationService.getMembers(1, 100),
    staleTime: 5 * 60 * 1000,
  })

  const members = data?.data.data?.items?.filter(m => m.isActive) ?? []
  const selectedMember = members.find(m => m.id === value)

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-surface-300">
        Assignee
        <span className="text-surface-600 font-normal ml-1">(optional)</span>
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'input-field cursor-pointer',
          error && 'border-red-500 focus:ring-red-500'
        )}
      >
        <option value="">Unassigned</option>
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.fullName} — {member.role}
          </option>
        ))}
      </select>

      {/* Preview selected member */}
      {selectedMember && (
        <div className="flex items-center gap-2 text-xs text-surface-400 px-1">
          <Avatar name={selectedMember.fullName} size="sm" />
          <span>{selectedMember.fullName}</span>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400">⚠ {error}</p>
      )}
    </div>
  )
}