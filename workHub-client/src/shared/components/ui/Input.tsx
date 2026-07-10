import { forwardRef, type InputHTMLAttributes, type ElementType } from 'react'
import { cn } from '@/shared/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: ElementType
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon: Icon, className, id, ...props }, ref) => {
    const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-surface-200"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Icon className="h-4 w-4 text-surface-500" />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-lg border bg-surface-800 py-2 text-sm text-surface-100',
              'placeholder:text-surface-500',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-surface-900',
              Icon ? 'pl-10 pr-3' : 'px-3',
              error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-surface-700 focus:ring-primary-500 focus:border-transparent',
              className,
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
        {!error && hint && (
          <p className="text-xs text-surface-500">{hint}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'

export default Input
