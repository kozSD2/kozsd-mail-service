import { motion } from 'framer-motion'
import { clsx } from 'clsx'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'accent' | 'gray'
  className?: string
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
}

const colorClasses = {
  primary: 'border-primary-500',
  secondary: 'border-secondary-400',
  accent: 'border-accent-500',
  gray: 'border-gray-400',
}

export default function LoadingSpinner({
  size = 'md',
  color = 'primary',
  className,
}: LoadingSpinnerProps) {
  return (
    <motion.div
      className={clsx(
        'border-2 border-gray-200 rounded-full animate-spin',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      style={{
        borderTopColor: 'transparent',
      }}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
      aria-label="Loading"
    />
  )
}