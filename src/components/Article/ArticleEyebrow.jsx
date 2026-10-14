import { useStore } from "@nanostores/react"
import { useLayoutEffect, useRef } from "react"
import { useNavigate } from "react-router"

import CustomLink from "@/components/ui/CustomLink"
import FeedIcon from "@/components/ui/FeedIcon"
import InlineAction from "@/components/ui/InlineAction"
import useScreenWidth from "@/hooks/useScreenWidth"
import { setActiveContent, setFilterString, setFilterType } from "@/store/contentState"
import { settingsState } from "@/store/settingsState"
import { generateReadableDate, generateReadingTime, generateRelativeTime } from "@/utils/date"

import "./ArticleEyebrow.css"

const stopPropagation = (event) => event.stopPropagation()

// Items whose top sits this far below the previous item's start a new line.
const NEW_LINE_THRESHOLD_PX = 8

// Flag the first item of each wrapped line so CSS can drop its leading
// separator. An attribute React doesn't manage, so renders never clobber it.
const markLineStarts = (container) => {
  let previousTop = null
  for (const child of container.children) {
    const top = child.offsetTop
    child.toggleAttribute(
      "data-line-start",
      previousTop !== null && top > previousTop + NEW_LINE_THRESHOLD_PX,
    )
    previousTop = top
  }
}

/**
 * The one-line source line above an article title, shared by the Stream card
 * and the Classic reading pane: feed / category · author · time · read time.
 * The absolute date lives in the relative time's tooltip.
 */
const ArticleEyebrow = ({ centered = false, entry, hideTime = false, maxWidth }) => {
  const navigate = useNavigate()
  const { isBelowMedium } = useScreenWidth()
  const { showDetailedRelativeTime, showEstimatedReadingTime, showFeedIcon } =
    useStore(settingsState)

  const { category } = entry.feed
  const eyebrowRef = useRef(null)

  // Content changes re-run this after every render; the observer covers resizes.
  useLayoutEffect(() => {
    if (eyebrowRef.current) {
      markLineStarts(eyebrowRef.current)
    }
  })

  useLayoutEffect(() => {
    const eyebrow = eyebrowRef.current
    if (!eyebrow || typeof ResizeObserver !== "function") {
      return
    }
    const observer = new ResizeObserver(() => markLineStarts(eyebrow))
    observer.observe(eyebrow)
    return () => observer.disconnect()
  }, [])

  const handleAuthorFilter = (event) => {
    event.stopPropagation()
    setFilterType("author")
    setFilterString(entry.author)
    if (isBelowMedium) {
      setActiveContent(null)
    }
  }

  return (
    <div
      ref={eyebrowRef}
      className={centered ? "article-eyebrow article-eyebrow-centered" : "article-eyebrow"}
      style={maxWidth ? { maxWidth } : undefined}
    >
      <span className="article-eyebrow-lead">
        {showFeedIcon && <FeedIcon className="article-eyebrow-icon" feed={entry.feed} />}
        <span className="article-eyebrow-source" onClick={stopPropagation}>
          <CustomLink text={entry.feed.title} url={`/feed/${entry.feed.id}`} />
        </span>
      </span>
      {category?.title ? (
        <InlineAction
          className="article-eyebrow-item article-eyebrow-category"
          onClick={(event) => {
            event.stopPropagation()
            navigate(`/category/${category.id}`)
          }}
        >
          <span className="article-eyebrow-truncate">{category.title}</span>
        </InlineAction>
      ) : null}
      {entry.author ? (
        <InlineAction
          className="article-eyebrow-item article-eyebrow-author"
          onClick={handleAuthorFilter}
        >
          <span className="article-eyebrow-truncate">{entry.author}</span>
        </InlineAction>
      ) : null}
      {hideTime ? null : (
        <time
          className="article-eyebrow-item"
          dateTime={entry.published_at}
          title={generateReadableDate(entry.published_at)}
        >
          {generateRelativeTime(entry.published_at, showDetailedRelativeTime)}
        </time>
      )}
      {showEstimatedReadingTime ? (
        <span className="article-eyebrow-item">{generateReadingTime(entry.reading_time)}</span>
      ) : null}
    </div>
  )
}

export default ArticleEyebrow
