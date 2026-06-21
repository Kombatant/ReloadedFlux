import { Avatar, Button } from "@arco-design/web-react"
import { IconBook, IconExclamation, IconRefresh } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useState } from "react"

import "./ConnectionOverlay.css"

import useAppData from "@/hooks/useAppData"
import { polyglotState } from "@/hooks/useLanguage"
import { authState } from "@/store/authState"
import { connectionState, setServerUnreachable } from "@/store/connectionState"

const ConnectionOverlay = () => {
  const { isServerUnreachable } = useStore(connectionState)
  const { polyglot } = useStore(polyglotState)
  const { server } = useStore(authState)
  const { fetchAppData } = useAppData()

  const [isRetrying, setIsRetrying] = useState(false)

  if (!isServerUnreachable) {
    return null
  }

  const handleRefresh = async () => {
    setIsRetrying(true)
    // 乐观清除，请求成功时 onResponse 保持清除，失败时 hook 会重新置位
    setServerUnreachable(false)
    try {
      await fetchAppData()
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <div className="connection-overlay">
      <div aria-modal="true" className="connection-overlay-card" role="alertdialog">
        <div className="connection-overlay-icon-wrapper">
          <Avatar className="connection-overlay-icon" size={56}>
            <IconBook style={{ color: "var(--color-bg-1)" }} />
          </Avatar>
          <span className="connection-overlay-badge">
            <IconExclamation />
          </span>
        </div>
        <div className="connection-overlay-title">{polyglot.t("connection.title")}</div>
        <div className="connection-overlay-description">{polyglot.t("connection.description")}</div>
        <div className="connection-overlay-server" title={server}>
          {server}
        </div>
        <Button
          long
          icon={<IconRefresh />}
          loading={isRetrying}
          size="large"
          type="primary"
          onClick={handleRefresh}
        >
          {polyglot.t("connection.refresh")}
        </Button>
      </div>
    </div>
  )
}

export default ConnectionOverlay
