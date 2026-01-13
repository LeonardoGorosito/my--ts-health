import type { InputHTMLAttributes } from 'react'


export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
return <input className={`w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring ${className}`} {...props} />
}