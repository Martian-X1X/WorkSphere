import { cn } from '@/shared/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Logo({ size = 'md', className }: LogoProps) {
  const sizes = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-xl',
    lg: 'w-16 h-16 text-2xl',
  }

  return (
    <div
      className={cn(
        'bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0',
        sizes[size],
        className
      )}
    >
      <span className="text-white font-bold">W</span>
    </div>
  )
}