"use client"

import { Toaster } from "sileo"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemedToaster() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null
  const isDark = theme == "dark"
  return (
    <Toaster
      position="top-center"
      options={{
        fill: isDark ? "#FAFAFA" : "#1D1D1D",
        roundness: 14,
      }}
    />
  )
}
