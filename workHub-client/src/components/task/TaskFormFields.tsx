import { type UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/Input'
import { AssigneeSelect } from './AssigneeSelect'
import { type TaskFormData } from '@/lib/schemas'
import { cn } from '@/utils'

interface TaskFormFieldsProps {
  form: UseFormReturn<TaskFormData>
}

const PRIORITIES = [
  { value: 'Low',    label: '⬇  Low',    color: 'text-surface-400' },
  { value: 'Medium', label: '➡  Medium', color: 'text-blue-400' },
  { value: 'High',   label: '⬆  High',   color: 'text-orange-400' },
  { value: 'Urgent', label: '🔴 Urgent', color: 'text-red-400' },
]

export function TaskFormFields({ form }: TaskFormFieldsProps) {
  const { register, watch, setValue, formState: { errors } } = form
  const assignedToUserId = watch('assignedToUserId') ?? ''

  return (
    <div className="space-y-4">

      {/* Title */}
      <Input
        label="Task title"
        placeholder="e.g. Design the homepage hero section"
        error={errors.title?.message}
        autoFocus
        {...register('title')}
      />

      {/* Description */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-surface-300">
          Description
          <span className="text-surface-600 font-normal ml-1">(optional)</span>
        </label>
        <textarea
          rows={3}
          placeholder="What needs to be done?"
          className={cn(
            'input-field resize-none',
            errors.description && 'border-red-500 focus:ring-red-500'
          )}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-xs text-red-400">⚠ {errors.description.message}</p>
        )}
      </div>

      {/* Priority + Assignee */}
      <div className="grid grid-cols-2 gap-3">

        {/* Priority */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-surface-300">
            Priority
          </label>
          <select
            className={cn(
              'input-field cursor-pointer',
              errors.priority && 'border-red-500 focus:ring-red-500'
            )}
            {...register('priority')}
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          {errors.priority && (
            <p className="text-xs text-red-400">⚠ {errors.priority.message}</p>
          )}
        </div>

        {/* Assignee */}
        <AssigneeSelect
          value={assignedToUserId}
          onChange={(uid) => setValue('assignedToUserId', uid)}
          error={errors.assignedToUserId?.message}
        />
      </div>

      {/* Due Date + Estimate */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Due date"
          type="date"
          error={errors.dueDate?.message}
          {...register('dueDate')}
        />

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-surface-300">
            Estimate
            <span className="text-surface-600 font-normal ml-1">(hours)</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            placeholder="e.g. 4"
            className={cn(
              'input-field',
              errors.estimatedHours && 'border-red-500 focus:ring-red-500'
            )}
            {...register('estimatedHours')}
          />
          {errors.estimatedHours && (
            <p className="text-xs text-red-400">
              ⚠ {errors.estimatedHours.message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}