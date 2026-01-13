import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
}

export function Card({ children, className, ...rest }: CardProps) {
  const baseClasses = "rounded-xl border p-4 shadow-sm bg-white"
  const combinedClasses = `${baseClasses} ${className || ''}`

  return (
    <div className={combinedClasses} {...rest}>
      {children}
    </div>
  )
}