import type { ButtonHTMLAttributes } from 'react'

export function Button({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`
        inline-flex items-center justify-center px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all duration-300
        /* Modo Claro */
        bg-white border-2 border-gray-100 text-gray-700 hover:bg-gray-50 hover:border-gray-200 shadow-sm
        /* Modo Oscuro (Matte) */
        dark:bg-bg-card dark:border-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-800 dark:hover:text-white dark:shadow-none
        rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    />
  )
}