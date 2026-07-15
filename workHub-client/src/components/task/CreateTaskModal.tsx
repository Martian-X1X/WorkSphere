import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { TaskFormFields } from './TaskFormFields'
import { taskService } from '@/services/task.service'
import { taskSchema, type TaskFormData } from '@/lib/schemas'
import { getApiError } from '@/utils'

interface CreateTaskModalProps {
  open: boolean
  onClose: () => void
  projectId: string
}

export function CreateTaskModal({
  open,
  onClose,
  projectId,
}: CreateTaskModalProps) {
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

  const { handleSubmit, reset, formState: { errors } } = form

  const mutation = useMutation({
    mutationFn: (data: TaskFormData) => {
      // Convert hours → minutes (backend expects minutes)
      const estimatedMinutes = data.estimatedHours
        ? Math.round(Number(data.estimatedHours) * 60)
        : undefined

      return taskService.createTask(projectId, {
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
        priority: data.priority,
        assignedToUserId: data.assignedToUserId || undefined,
        dueDate: data.dueDate?.trim()
          ? new Date(data.dueDate).toISOString()
          : undefined,
        estimatedMinutes: estimatedMinutes || undefined,
      })
    },
    onSuccess: (res) => {
      // Invalidate tasks + project (task summary updates)
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      toast.success(`Task "${res.data.data.title}" created!`)
      reset()
      onClose()
    },
    onError: (error) => toast.error(getApiError(error)),
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="New Task" size="md">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
        <TaskFormFields form={form} />

        <div className="flex gap-2 pt-1">
          <Button
            variant="secondary"
            type="button"
            className="flex-1"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 flex items-center justify-center gap-2"
            loading={mutation.isPending}
          >
            <CheckSquare className="w-4 h-4" />
            {mutation.isPending ? 'Creating...' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}