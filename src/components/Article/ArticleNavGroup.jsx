import { IconArrowLeft, IconArrowRight } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"

import IconButton from "@/components/ui/IconButton"
import { polyglotState } from "@/hooks/useLanguage"
import {
  contentState,
  filteredEntriesState,
  nextContentState,
  prevContentState,
} from "@/store/contentState"
import { hotkeysState } from "@/store/hotkeysState"
import { withHotkey } from "@/utils/hotkey-label"

import "./ArticleNavGroup.css"

/**
 * Previous / next with the open article's place in the list between them
 * ("1 / 48"), on one control-group track. Shared by the Classic reading pane's
 * top bar and the Stream toolbar; each passes its own navigation handlers.
 */
const ArticleNavGroup = ({ onNext, onPrevious }) => {
  const { activeContent, loadMoreVisible, total: listTotal } = useStore(contentState)
  const filteredEntries = useStore(filteredEntriesState)
  const prevContent = useStore(prevContentState)
  const nextContent = useStore(nextContentState)
  const hotkeys = useStore(hotkeysState)
  const { polyglot } = useStore(polyglotState)

  const position = activeContent
    ? filteredEntries.findIndex((entry) => entry.id === activeContent.id) + 1
    : 0
  // While more pages can load, use the server's total for this view; once
  // everything is loaded, the list itself is exact (client-side filters such
  // as duplicate removal can make it shorter than the server's count).
  const total = loadMoreVisible
    ? Math.max(listTotal, filteredEntries.length)
    : filteredEntries.length
  const previousLabel = polyglot.t("article_card.previous_tooltip")
  const nextLabel = polyglot.t("article_card.next_tooltip")

  return (
    <div
      className="article-nav-group app-control-group"
      role="group"
      aria-label={
        position > 0 ? polyglot.t("article_card.position_label", { position, total }) : undefined
      }
    >
      <IconButton
        disabled={!prevContent}
        icon={<IconArrowLeft />}
        label={previousLabel}
        size="sm"
        tooltip={withHotkey(previousLabel, hotkeys.navigateToPreviousArticle)}
        onClick={onPrevious}
      />
      {position > 0 ? (
        <span aria-hidden="true" className="article-nav-position">
          {position} / {total}
        </span>
      ) : null}
      <IconButton
        disabled={!nextContent}
        icon={<IconArrowRight />}
        label={nextLabel}
        size="sm"
        tooltip={withHotkey(nextLabel, hotkeys.navigateToNextArticle)}
        onClick={onNext}
      />
    </div>
  )
}

export default ArticleNavGroup
