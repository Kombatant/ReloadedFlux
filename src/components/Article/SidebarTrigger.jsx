import { Drawer } from "@arco-design/web-react"
import { IconMenu } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { atom } from "nanostores"
import { useEffect } from "react"
import { useLocation } from "react-router"

import Sidebar from "@/components/Sidebar/Sidebar"
import IconButton from "@/components/ui/IconButton"
import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import "./SidebarTrigger.css"
import createSetter from "@/utils/nanostores"

const sidebarVisibleState = atom(false)
const setSidebarVisible = createSetter(sidebarVisibleState)

export default function SidebarTrigger() {
  const currentPath = useLocation().pathname
  const { isBelowLarge } = useScreenWidth()

  const sidebarVisible = useStore(sidebarVisibleState)
  const { polyglot } = useStore(polyglotState)

  useEffect(() => {
    if (!isBelowLarge) {
      setSidebarVisible(false)
    }
  }, [isBelowLarge])

  useEffect(() => {
    if (currentPath) {
      setSidebarVisible(false)
    }
  }, [currentPath])

  if (!isBelowLarge) {
    return null
  }

  return (
    <div className="sidebar-trigger">
      <IconButton
        icon={<IconMenu />}
        label={polyglot.t("sidebar.open_menu")}
        tooltip={null}
        onClick={() => setSidebarVisible(!sidebarVisible)}
      />
      <Drawer
        className="sidebar-drawer"
        closable={false}
        footer={null}
        placement="left"
        title={null}
        visible={sidebarVisible}
        width={240}
        onCancel={() => setSidebarVisible(false)}
      >
        <Sidebar />
      </Drawer>
    </div>
  )
}
