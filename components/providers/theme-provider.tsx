'use client'

import { useEffect, useState } from 'react'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Get saved theme from localStorage or use system preference
    const savedTheme = localStorage.getItem('theme') || 'light'
    const root = document.documentElement

    // Set the initial theme
    if (savedTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    setMounted(true)

    // Listen for theme changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        const newTheme = e.newValue || 'light'
        if (newTheme === 'dark') {
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Prevent hydration mismatch
  if (!mounted) return <>{children}</>

  return <>{children}</>
}
