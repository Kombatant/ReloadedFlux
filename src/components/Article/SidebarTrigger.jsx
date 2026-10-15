import { IconMenu } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"

import IconButton from "@/components/ui/IconButton"
import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import { settingsState } from "@/store/settingsState"
import { setSidebarVisible, sidebarVisibleState } from "@/store/sidebarState"
import "./SidebarTrigger.css"

export default function SidebarTrigger() {
  const { isBelowLarge } = useScreenWidth()
  const { sidebarPinned } = useStore(settingsState)

  const sidebarVisible = useStore(sidebarVisibleState)
  const { polyglot } = useStore(polyglotState)

  if (!isBelowLarge && sidebarPinned) {
    return null
  }

  return (
    <div className="sidebar-trigger">
      <IconButton
        aria-expanded={sidebarVisible}
        aria-haspopup="dialog"
        icon={<IconMenu />}
        label={polyglot.t("sidebar.open_menu")}
        tooltip={null}
        onClick={() => setSidebarVisible(!sidebarVisible)}
      />
    </div>
  )
}
