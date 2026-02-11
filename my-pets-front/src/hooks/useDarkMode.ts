import { useEffect, useState } from 'react'

export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    // 1. Intentar leer lo que el usuario eligió antes
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    
    // 2. Si no hay nada guardado, mirar la preferencia del sistema (Windows/Linux)
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const root = window.document.documentElement
    if (isDark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  return { isDark, toggle: () => setIsDark(prev => !prev) }
}