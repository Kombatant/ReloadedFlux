import { Button } from "@arco-design/web-react"
import { IconExclamationCircle } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useEffect } from "react"
import { useNavigate, useRouteError } from "react-router"

import EmptyState from "@/components/ui/EmptyState"
import useLanguage, { polyglotState } from "@/hooks/useLanguage"
import hideSpinner from "@/utils/loading"

import "./ErrorPage.css"

const ErrorPage = () => {
  useLanguage()
  const { polyglot } = useStore(polyglotState)
  const navigate = useNavigate()
  const error = useRouteError()
  console.error(error)

  useEffect(() => {
    hideSpinner()
  }, [])

  return (
    <div className="error-page" id="error-page">
      <EmptyState
        description={error?.statusText || error?.message}
        icon={<IconExclamationCircle />}
        title={polyglot?.t("app.error_title") ?? "Something went wrong"}
        tone="danger"
        actions={
          <Button type="primary" onClick={() => navigate("/")}>
            {polyglot?.t("app.back_home") ?? "Back to home"}
          </Button>
        }
      />
    </div>
  )
}

export default ErrorPage
