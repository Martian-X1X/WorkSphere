import { type ReactNode, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/utils'

// ── FormField wrapper ──────────────────────────────────────────────
interface FormFieldProps {
  label:     string
  required?: boolean
  optional?: boolean
  error?:    string
  warning?:  string      // yellow — not an error, just a heads-up
  hint?:     string      // grey — helper text below field
  children:  ReactNode
}

export function FormField({
  label,
  required = false,
  optional = false,
  error,
  warning,
  hint,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium text-surface-300">
        {label}
        {required && <span className="text-red-400">*</span>}
        {optional && (
          <span className="text-xs text-surface-600 font-normal">
            (optional)
          </span>
        )}
      </label>

      {children}

      {/* Error */}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-400 animate-fade-in">
          <span>⚠</span>
          {error}
        </p>
      )}

      {/* Warning (yellow — not blocking) */}
      {!error && warning && (
        <p className="flex items-center gap-1 text-xs text-yellow-400 animate-fade-in">
          <span>⚡</span>
          {warning}
        </p>
      )}

      {/* Hint */}
      {!error && !warning && hint && (
        <p className="text-xs text-surface-600">{hint}</p>
      )}
    </div>
  )
}

// ── Textarea with character count ──────────────────────────────────
interface TextareaFieldProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label:     string
  optional?: boolean
  error?:    string
  maxLength: number
  value:     string
  hint?:     string
}

export function TextareaField({
  label,
  optional = false,
  error,
  maxLength,
  value,
  hint,
  ...props
}: TextareaFieldProps) {
  const count     = value?.length ?? 0
  const isNearMax = count > maxLength * 0.85
  const isAtMax   = count >= maxLength

  return (
    <FormField label={label} optional={optional} error={error} hint={hint}>
      <div className="relative">
        <textarea
          rows={3}
          maxLength={maxLength}
          value={value}
          className={cn(
            'input-field resize-none pb-6',
            error && 'border-red-500/70 focus:ring-red-500/30',
          )}
          {...props}
        />
        {/* Character count */}
        <span className={cn(
          'absolute bottom-2 right-3 text-[10px] pointer-events-none',
          isAtMax   ? 'text-red-400'    :
          isNearMax ? 'text-yellow-400' :
          'text-surface-600'
        )}>
          {count}/{maxLength}
        </span>
      </div>
    </FormField>
  )
}
