import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { TaskFormFields } from './TaskFormFields'
import { taskService } from '@/services/task.service'
import { taskSchema, type TaskFormData } from '@/lib/schemas'
import { getApiError } from '@/utils'
import type { Task } from '@/types'

interface EditTaskModalProps {
  task: Task | null
  open: boolean
  onClose: () => void
}

export function EditTaskModal({ task, open, onClose }: EditTaskModalProps) {
  const queryClient = useQueryClient()

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'Medium',
      assignedToUserId: '',
      dueDate: '',
      estimatedHours: '',
    },
  })

  const { handleSubmit, reset } = form

  // ✅ Pre-fill form when task changes
  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description ?? '',
        priority: task.priority as TaskFormData['priority'],
        assignedToUserId: task.assignedToUserId ?? '',
        // Convert ISO date → YYYY-MM-DD for <input type="date">
        dueDate: task.dueDate
          ? task.dueDate.split('T')[0]
          : '',
        // Convert minutes → hours for display
        estimatedHours: task.estimatedMinutes
          ? String(task.estimatedMinutes / 60)
          : '',
      })
    }
  }, [task, reset])

  const mutation = useMutation({
    mutationFn: (data: TaskFormData) => {
    const estimatedMinutes = data.estimatedHours
        ? Math.round(Number(data.estimatedHours) * 60)
        : undefined

    return taskService.updateTask(task!.id, {
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
        priority: data.priority,
        // ✅ ADD — send current assignee so backend doesn't clear it
        assignedToUserId: data.assignedToUserId || null,
        dueDate: data.dueDate?.trim()
        ? new Date(data.dueDate).toISOString()
        : undefined,
        estimatedMinutes: estimatedMinutes || undefined,
    })
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', task!.projectId] })
      queryClient.invalidateQueries({ queryKey: ['task', task!.id] })
      queryClient.invalidateQueries({ queryKey: ['project', task!.projectId] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Task updated successfully!')
      onClose()
    },
    onError: (error) => toast.error(getApiError(error)),
  })

  if (!task) return null

  return (
    <Modal open={open} onClose={onClose} title="Edit Task" size="md">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
        <TaskFormFields form={form} />

        <div className="flex gap-2 pt-1">
          <Button
            variant="secondary"
            type="button"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 flex items-center justify-center gap-2"
            loading={mutation.isPending}
          >
            <Save className="w-4 h-4" />
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}