import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {

    const variants = {
      primary:   'btn-primary',
      secondary: 'btn-secondary',
      ghost:     'btn-ghost',
      danger:    'btn-danger',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-xs rounded-lg min-h-[36px]',
      md: 'px-4 py-2 text-sm rounded-xl min-h-[40px]',
      lg: 'px-5 py-2.5 text-base rounded-xl min-h-[44px]',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2',
          'font-medium transition-all duration-150',
          'cursor-pointer active:scale-[0.98]',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-current border-t-transparent
                             rounded-full animate-spin" />
            {children}
          </span>
        ) : children}
      </button>
    )
  }
)

Button.displayName = 'Button'