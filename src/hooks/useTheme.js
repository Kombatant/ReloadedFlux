import { useStore } from "@nanostores/react"
import { useEffect, useState } from "react"

import { settingsState, updateSettings } from "@/store/settingsState"
import { applyColor, getModeFallbackColor, isModeRestrictedColor } from "@/utils/colors"
import { prefersReducedMotion } from "@/utils/scroll-timing"

const useTheme = () => {
  const { animationsEnabled, themeColor, themeMode } = useStore(settingsState)
  const [isSystemDark, setIsSystemDark] = useState(
    globalThis.matchMedia("(prefers-color-scheme: dark)").matches,
  )

  useEffect(() => {
    const mediaQuery = globalThis.matchMedia("(prefers-color-scheme: dark)")
    const updateSystemDarkMode = (event) => setIsSystemDark(event.matches)

    mediaQuery.addEventListener("change", updateSystemDarkMode)

    // 在组件卸载时清除监听器
    return () => mediaQuery.removeEventListener("change", updateSystemDarkMode)
  }, [])

  useEffect(() => {
    document.body.dataset.animations = animationsEnabled === false ? "off" : "on"
  }, [animationsEnabled])

  useEffect(() => {
    const effectiveDark = themeMode === "system" ? isSystemDark : themeMode === "dark"

    if (isModeRestrictedColor(themeColor, effectiveDark)) {
      updateSettings({ themeColor: getModeFallbackColor(themeColor) })
      return
    }

    const mode = effectiveDark ? "dark" : "light"
    const previousMode = document.body.getAttribute("arco-theme")
    let cancelled = false
    const applyTheme = () => {
      if (cancelled) {
        return
      }
      applyColor(themeColor)
      document.body.setAttribute("arco-theme", mode)
      document.body.style.colorScheme = mode
    }

    if (
      !previousMode ||
      previousMode === mode ||
      animationsEnabled === false ||
      prefersReducedMotion() ||
      !document.startViewTransition
    ) {
      applyTheme()
      return
    }

    const transition = document.startViewTransition(applyTheme)
    // Skipping an interrupted fade rejects ready, but still runs the update callback.
    transition.ready.catch(() => {})

    return () => {
      cancelled = true
      transition.skipTransition()
    }
  }, [animationsEnabled, isSystemDark, themeMode, themeColor])
}

export default useTheme
