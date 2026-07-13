import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { FolderPlus } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { projectService } from '@/services/project.service'
import { getApiError } from '@/utils'

const schema = z
  .object({
    name: z
      .string()
      .min(1, 'Project name is required')
      .max(200, 'Name cannot exceed 200 characters'),
    description: z.string().max(2000).optional(),
    startDate: z.string().optional(),
    dueDate: z.string().optional(),
  })
  .refine(
    (d) => {
      if (d.startDate && d.dueDate) {
        return new Date(d.dueDate) > new Date(d.startDate)
      }
      return true
    },
    { message: 'Due date must be after start date', path: ['dueDate'] }
  )

type FormData = z.infer<typeof schema>

interface CreateProjectModalProps {
  open: boolean
  onClose: () => void
}

export function CreateProjectModal({ open, onClose }: CreateProjectModalProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      projectService.createProject({
        name: data.name,
        description: data.description,
        startDate: data.startDate || undefined,
        dueDate: data.dueDate || undefined,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success(`Project "${res.data.data.name}" created!`)
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
    <Modal open={open} onClose={handleClose} title="New Project" size="md">
      <form
        onSubmit={handleSubmit((d) => mutation.mutate(d))}
        className="space-y-4"
      >
        {/* Name */}
        <Input
          label="Project name"
          placeholder="e.g. Website Redesign"
          error={errors.name?.message}
          autoFocus
          {...register('name')}
        />

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-surface-300">
            Description
            <span className="text-surface-600 font-normal ml-1">(optional)</span>
          </label>
          <textarea
            rows={3}
            placeholder="What is this project about?"
            className="input-field resize-none"
            {...register('description')}
          />
          {errors.description && (
            <p className="text-xs text-red-400">
              ⚠ {errors.description.message}
            </p>
          )}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start date"
            type="date"
            error={errors.startDate?.message}
            {...register('startDate')}
          />
          <Input
            label="Due date"
            type="date"
            error={errors.dueDate?.message}
            {...register('dueDate')}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="secondary"
            className="flex-1"
            type="button"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 flex items-center justify-center gap-2"
            type="submit"
            loading={mutation.isPending}
          >
            <FolderPlus className="w-4 h-4" />
            {mutation.isPending ? 'Creating...' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}