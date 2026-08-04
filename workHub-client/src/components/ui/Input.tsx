import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:    string
  error?:    string
  warning?:  string
  hint?:     string
  optional?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, warning, hint, optional, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-')

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="flex items-center gap-1.5 text-sm font-medium text-surface-300"
          >
            {label}
            {optional && (
              <span className="text-xs text-surface-600 font-normal">
                (optional)
              </span>
            )}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          className={cn(
            'input-field',
            error   && 'border-red-500/70 focus:ring-red-500/30',
            warning && !error && 'border-yellow-500/50 focus:ring-yellow-500/20',
            className,
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />

        {/* Error */}
        {error && (
          <p
            id={`${inputId}-error`}
            className="flex items-center gap-1 text-xs text-red-400 animate-fade-in"
          >
            <span>⚠</span> {error}
          </p>
        )}

        {/* Warning */}
        {!error && warning && (
          <p className="flex items-center gap-1 text-xs text-yellow-400 animate-fade-in">
            <span>⚡</span> {warning}
          </p>
        )}

        {/* Hint */}
        {!error && !warning && hint && (
          <p className="text-xs text-surface-600">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
