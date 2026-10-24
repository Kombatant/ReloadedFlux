import { Typography } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"

import useScreenWidth from "@/hooks/useScreenWidth"
import { settingsState } from "@/store/settingsState"

import ArticleBodyRenderer from "./ArticleBodyRenderer"
import ArticleEyebrow from "./ArticleEyebrow"

/**
 * The Column reading pane's header (eyebrow + title) and body. Shared by the
 * pane itself and the Appearance preview in Settings.
 */
const ArticleReadingView = ({ entry, lightboxState }) => {
  const { isBelowMedium } = useScreenWidth()
  const { articleWidth, fontFamily, titleAlignment } = useStore(settingsState)
  const isCentered = titleAlignment === "center"
  const maxWidth = isBelowMedium
    ? "90%"
    : `min(${articleWidth}%, calc(100% - (var(--article-side-gutter) * 2)))`

  return (
    <>
      <div
        className="article-header"
        style={{ maxWidth, textAlign: isCentered ? "center" : "left" }}
      >
        <ArticleEyebrow centered={isCentered} entry={entry} />
        <Typography.Title className="article-title" heading={3} style={{ fontFamily: fontFamily }}>
          <a href={entry.url} rel="noopener noreferrer" target="_blank">
            {entry.title}
          </a>
        </Typography.Title>
      </div>
      <ArticleBodyRenderer entry={entry} lightboxState={lightboxState} maxWidth={maxWidth} />
    </>
  )
}

export default ArticleReadingView
