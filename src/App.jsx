import { Layout } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { useEffect, useState } from "react"

import "./App.css"
import ConnectionOverlay from "./components/ConnectionOverlay/ConnectionOverlay"
import Main from "./components/Main/Main"
import Sidebar from "./components/Sidebar/Sidebar"
import AppConfigProvider from "./components/ui/AppConfigProvider"
import useFeedIconsSync from "./hooks/useFeedIconsSync"
import useLanguage, { polyglotState } from "./hooks/useLanguage"
import useScreenWidth from "./hooks/useScreenWidth"
import useTheme from "./hooks/useTheme"
import useVersionCheck from "./hooks/useVersionCheck"
import { settingsState, updateSettings } from "./store/settingsState"
import hideSpinner from "./utils/loading"

const clampNumber = (value, min, max) => Math.min(max, Math.max(min, value))

const App = () => {
  useLanguage()
  useTheme()
  useFeedIconsSync()

  const { hasUpdate, dismissUpdate, remoteBuildInfo } = useVersionCheck()

  const { isBelowLarge } = useScreenWidth()

  const { polyglot } = useStore(polyglotState)
  const { fontFamily, sidebarWidth: storedSidebarWidth } = useStore(settingsState)

  const [sidebarWidth, setSidebarWidth] = useState(storedSidebarWidth ?? 240)
  const [isResizingSidebar, setIsResizingSidebar] = useState(false)

  useEffect(() => {
    hideSpinner()
  }, [])

  useEffect(() => {
    const root = globalThis?.document?.documentElement
    if (!root) {
      return
    }

    if (fontFamily) {
      root.style.setProperty("--app-font-family", fontFamily)
    } else {
      root.style.removeProperty("--app-font-family")
    }
  }, [fontFamily])

  const handleSidebarSplitterPointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return
    }

    event.preventDefault()

    const startX = event.clientX
    const startWidth = sidebarWidth
    let latestWidth = startWidth

    const minWidth = 180
    const maxWidth = 480

    document.body.style.userSelect = "none"
    setIsResizingSidebar(true)

    const handlePointerMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX
      const nextWidth = clampNumber(startWidth + delta, minWidth, maxWidth)
      latestWidth = nextWidth
      setSidebarWidth(nextWidth)
    }

    const handlePointerUp = () => {
      document.body.style.userSelect = ""
      setIsResizingSidebar(false)
      updateSettings({ sidebarWidth: latestWidth })
      globalThis.removeEventListener("pointermove", handlePointerMove)
      globalThis.removeEventListener("pointerup", handlePointerUp)
    }

    globalThis.addEventListener("pointermove", handlePointerMove)
    globalThis.addEventListener("pointerup", handlePointerUp)
  }

  return (
    polyglot && (
      <AppConfigProvider>
        <div
          className="app"
          style={
            isBelowLarge
              ? undefined
              : {
                  gridTemplateColumns: `${sidebarWidth}px var(--pane-splitter-size) 1fr`,
                }
          }
        >
          {isBelowLarge ? null : (
            <Layout.Sider
              breakpoint="lg"
              className="sidebar"
              collapsible={false}
              trigger={null}
              width={sidebarWidth}
            >
              <Sidebar
                dismissUpdate={dismissUpdate}
                hasUpdate={hasUpdate}
                remoteBuildInfo={remoteBuildInfo}
              />
            </Layout.Sider>
          )}
          {isBelowLarge ? null : (
            <div
              aria-label="Resize sidebar"
              aria-orientation="vertical"
              role="separator"
              className={
                isResizingSidebar
                  ? "pane-splitter app-splitter is-dragging"
                  : "pane-splitter app-splitter"
              }
              onPointerDown={handleSidebarSplitterPointerDown}
            />
          )}
          <Main />
        </div>
        <ConnectionOverlay />
      </AppConfigProvider>
    )
  )
}

export default App
