import type { InputHTMLAttributes } from 'react'

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input 
      className={`
        w-full px-4 py-3 text-sm font-bold outline-none transition-all duration-300
        /* Modo Claro */
        bg-gray-50 border-2 border-gray-100 text-gray-900 placeholder-gray-400 focus:border-emerald-600
        /* Modo Oscuro (Matte) */
        dark:bg-bg-matte dark:border-neutral-800 dark:text-gray-100 dark:placeholder-neutral-600 dark:focus:border-emerald-500
        rounded-2xl
        ${className}
      `} 
      {...props} 
    />
  )
}