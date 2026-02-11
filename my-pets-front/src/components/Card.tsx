import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ children, className, ...rest }: CardProps) {
  const baseClasses = `
    rounded-3xl border border-gray-100 dark:border-neutral-800 
    p-4 shadow-sm bg-white dark:bg-bg-card 
    transition-all duration-300
  `
  const combinedClasses = `${baseClasses} ${className || ''}`

  return (
    <div className={combinedClasses} {...rest}>
      {children}
    </div>
  )
}