import { Button } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { forwardRef } from "react"

import { polyglotState } from "@/hooks/useLanguage"

import "./controls.css"

/** The "load more" row at the end of an article list, shared by both layouts. */
const LoadMore = forwardRef(({ loading, onLoad }, ref) => {
  const { polyglot } = useStore(polyglotState)

  return (
    <div ref={ref} className="app-load-more">
      <Button loading={loading} type="text" onClick={onLoad}>
        {loading ? polyglot.t("article_list.loading_more") : polyglot.t("article_list.load_more")}
      </Button>
    </div>
  )
})

LoadMore.displayName = "LoadMore"

export default LoadMore
