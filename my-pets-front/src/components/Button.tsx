import type { ButtonHTMLAttributes } from 'react'


export function Button({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50 ${className}`}
      {...props}
    />
  )
}