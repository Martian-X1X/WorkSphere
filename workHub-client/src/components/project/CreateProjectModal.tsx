import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { FolderPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { Modal }         from '@/components/ui/Modal'
import { Button }        from '@/components/ui/Button'
import { Input }         from '@/components/ui/Input'
import { TextareaField } from '@/components/ui/FormField'
import { projectService } from '@/services/project.service'
import { projectSchema, type ProjectFormData } from '@/lib/schemas'
import { getApiError } from '@/utils'
import { queryKeys }  from '@/lib/queryKeys'

type ProjectFormValues = z.input<typeof projectSchema>

interface CreateProjectModalProps {
  open:    boolean
  onClose: () => void
}

export function CreateProjectModal({ open, onClose }: CreateProjectModalProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isValid },
  } = useForm<ProjectFormValues, unknown, ProjectFormData>({
    resolver:          zodResolver(projectSchema),
    mode:              'onBlur',          // validate on field blur
    reValidateMode:    'onChange',        // re-validate on change after first blur
    defaultValues: {
      name:        '',
      description: '',
      startDate:   '',
      dueDate:     '',
    },
  })

  const description = useWatch({ control, name: 'description' }) ?? ''
  const dueDate     = useWatch({ control, name: 'dueDate' })

  // Due date in past warning (not an error)
  const dueDateWarning = (() => {
    if (!dueDate) return undefined
    const due = new Date(dueDate)
    if (due < new Date()) return 'This date is in the past'
    return undefined
  })()

  const mutation = useMutation({
    mutationFn: (data: ProjectFormData) =>
      projectService.createProject({
        name:        data.name.trim(),
        description: data.description?.trim() || undefined,
        startDate:   data.startDate || undefined,
        dueDate:     data.dueDate   || undefined,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() })
      queryClient.invalidateQueries({ queryKey: ['activity'] })
      toast.success(`Project "${res.data.data.name}" created!`)
      reset()
      onClose()
    },
    onError: (error) => toast.error(getApiError(error)),
  })

  const handleClose = () => { reset(); onClose() }

  return (
    <Modal open={open} onClose={handleClose} title="New Project" size="md">
      <form
        onSubmit={handleSubmit((d) => mutation.mutate(d))}
        className="space-y-4"
        noValidate
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
        <TextareaField
          label="Description"
          optional
          placeholder="What is this project about?"
          maxLength={2000}
          value={description}
          error={errors.description?.message}
          {...register('description')}
        />

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start date"
            type="date"
            optional
            error={errors.startDate?.message}
            {...register('startDate')}
          />
          <Input
            label="Due date"
            type="date"
            optional
            error={errors.dueDate?.message}
            warning={!errors.dueDate ? dueDateWarning : undefined}
            {...register('dueDate')}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
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
            disabled={!isValid || mutation.isPending}
          >
            <FolderPlus className="w-4 h-4" />
            {mutation.isPending ? 'Creating...' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
