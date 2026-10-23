import { Typography } from "@arco-design/web-react"
import {
  IconCloudDownload,
  IconLaunch,
  IconMinusCircle,
  IconRecord,
  IconSave,
  IconStar,
  IconStarFill,
} from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { memo, useEffect, useLayoutEffect, useMemo, useRef } from "react"

import { updateEntriesStatus } from "@/apis"
import AiSpark from "@/components/icons/AiSpark"
import useEntryActions from "@/hooks/useEntryActions"
import useFetchOriginalTooltip from "@/hooks/useFetchOriginalTooltip"
import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import { fetchingContentIdsState, summarizingContentIdsState } from "@/store/contentState"
import { dataState } from "@/store/dataState"
import { hotkeysState } from "@/store/hotkeysState"
import { settingsState } from "@/store/settingsState"
import {
  freezeMediaLoading,
  observeIframeLoadState,
  unfreezeMediaLoading,
} from "@/utils/content-freeze"
import { generateClockTime, generateDayLabel, generateReadableDate } from "@/utils/date"
import { Message } from "@/utils/feedback"
import { getEntryImageSources, preloadImageMetadata } from "@/utils/images"
import { streamDebug } from "@/utils/stream-debug"

import ArticleActionBar from "./ArticleActionBar"
import ArticleBodyRenderer from "./ArticleBodyRenderer"
import ArticleEyebrow from "./ArticleEyebrow"
import CardIconBackdrop from "./CardIconBackdrop"

import "./StreamArticleCard.css"

const isInteractiveTarget = (target) =>
  target.closest("a, button, input, textarea, select, [role='button']")

const withStopPropagation = (callback) => (event) => {
  event.stopPropagation()
  callback()
}

// The card selects itself on click; keep footer clicks from reaching it.
const isolateClicks = (actions) =>
  actions.map((action) => ({ ...action, onClick: withStopPropagation(action.onClick) }))

const hasCombinedSelection = () => {
  if (globalThis.window === undefined) {
    return false
  }

  const selection = globalThis.window.getSelection()
  return Boolean(selection && !selection.isCollapsed && selection.toString().trim())
}

/**
 * Action bar under every card. It is on every card, not just the selected one,
 * so selecting a card never changes any card's height: a bar that came and
 * went made the card above shrink ~49px mid-navigation and the newly selected
 * card bounce before alignment caught up. Next and the key hints act on the
 * selected entry, so only the selected card shows them; both sit on the same
 * single row, so they don't change the height either.
 */
const StreamCardFooter = ({ entry, isSelected }) => {
  const { hasIntegrations } = useStore(dataState)
  const { aiProvider } = useStore(settingsState)
  const hotkeys = useStore(hotkeysState)
  const fetchingContentIds = useStore(fetchingContentIdsState)
  const summarizingContentIds = useStore(summarizingContentIdsState)
  const { polyglot } = useStore(polyglotState)
  const fetchOriginalTooltip = useFetchOriginalTooltip()
  const {
    handleFetchContent,
    handleOpenLinkExternally,
    handleSaveToThirdPartyServices,
    handleSummarizeContent,
    handleToggleStarred,
    handleToggleStatus,
  } = useEntryActions()

  const isUnread = entry.status === "unread"
  const isStarred = entry.starred
  const hasAiSummary = entry.content?.includes("ai-summary")

  const leadingActions = [
    {
      key: "status",
      icon: isUnread ? <IconMinusCircle /> : <IconRecord />,
      label: polyglot.t(
        isUnread ? "article_card.mark_as_read_tooltip" : "article_card.mark_as_unread_tooltip",
      ),
      hint: hotkeys.toggleReadStatus,
      onClick: () => handleToggleStatus(entry),
    },
    {
      key: "star",
      icon: isStarred ? <IconStarFill /> : <IconStar />,
      label: polyglot.t(isStarred ? "article_card.unstar_tooltip" : "article_card.star_tooltip"),
      hint: hotkeys.toggleStarStatus,
      starred: isStarred,
      onClick: () => handleToggleStarred(entry),
    },
    {
      key: "summarize",
      icon: <AiSpark />,
      label: polyglot.t("article_card.summarize_label"),
      tooltip: polyglot.t("article_card.summarize_tooltip"),
      hint: hotkeys.summarizeContent,
      disabled: aiProvider === "none" || hasAiSummary,
      loading: summarizingContentIds.has(entry.id),
      onClick: () => handleSummarizeContent(entry),
    },
    {
      key: "fetch",
      icon: <IconCloudDownload />,
      label: polyglot.t("article_card.fetch_original_label"),
      tooltip: fetchOriginalTooltip,
      hint: hotkeys.fetchOriginalArticle,
      loading: fetchingContentIds.has(entry.id),
      onClick: () => handleFetchContent(entry),
    },
    hasIntegrations
      ? {
          key: "save",
          icon: <IconSave />,
          label: polyglot.t("article_card.save_label"),
          tooltip: polyglot.t("article_card.save_to_third_party_services_tooltip"),
          hint: hotkeys.saveToThirdPartyServices,
          onClick: () => handleSaveToThirdPartyServices(entry),
        }
      : null,
  ].filter(Boolean)

  const trailingActions = [
    {
      key: "open",
      icon: <IconLaunch />,
      label: polyglot.t("article_card.open_original_label"),
      tooltip: polyglot.t("article_card.open_link_externally_tooltip"),
      hint: hotkeys.openLinkExternally,
      onClick: () => handleOpenLinkExternally(entry),
    },
  ]

  return (
    <ArticleActionBar
      className="stream-story-footer"
      hideHints={!isSelected}
      leading={isolateClicks(leadingActions)}
      trailing={isolateClicks(trailingActions)}
    />
  )
}

const StreamArticleCard = ({
  activeEntry,
  entry,
  handleEntryClick,
  infoFrom,
  isSelected,
  shouldPreload,
  showDayHeader = false,
  timelineDate = null,
}) => {
  const {
    articleWidth,
    cardIconBackdrop,
    markReadOnScroll,
    streamImageLayout,
    streamRenderSelectedOnly,
    titleAlignment,
  } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)
  const { isBelowMedium } = useScreenWidth()

  const { handleEntryStatusUpdate } = useEntryActions()

  const currentEntry = activeEntry ?? entry
  const isUnread = currentEntry.status === "unread"
  const isTimeline = timelineDate !== null
  const isCentered = titleAlignment === "center"
  const contentMaxWidth = isBelowMedium ? "100%" : `${articleWidth}%`
  const previewText = useMemo(() => currentEntry.previewText || "", [currentEntry.previewText])
  const titleClassName = isUnread
    ? "stream-story-title"
    : "stream-story-title stream-story-title-read"
  const cardRef = useRef(null)
  const wasEverSelectedRef = useRef(false)
  const wasVisible = useRef(false)

  useEffect(() => {
    wasVisible.current = false

    if (
      !markReadOnScroll ||
      infoFrom === "history" ||
      currentEntry.status !== "unread" ||
      typeof IntersectionObserver !== "function"
    ) {
      return
    }

    const element = cardRef.current
    const rootElement = element?.closest(".simplebar-content-wrapper")

    if (!element || !rootElement) {
      return
    }

    let isCancelled = false

    const markEntryAsRead = () => {
      handleEntryStatusUpdate(currentEntry, "read")
      updateEntriesStatus([currentEntry.id], "read").catch(() => {
        Message.error(polyglot.t("content.mark_as_read_error"))

        if (!isCancelled) {
          handleEntryStatusUpdate(currentEntry, "unread")
        }
      })
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const observerEntry of entries) {
          const { boundingClientRect, rootBounds, isIntersecting } = observerEntry

          if (isIntersecting) {
            wasVisible.current = true
            continue
          }

          if (
            wasVisible.current &&
            rootBounds &&
            boundingClientRect.top < rootBounds.top &&
            currentEntry.status === "unread"
          ) {
            wasVisible.current = false
            observer.unobserve(observerEntry.target)
            markEntryAsRead()
          }
        }
      },
      {
        root: rootElement,
        threshold: 0.2,
      },
    )

    observer.observe(element)

    return () => {
      isCancelled = true
      wasVisible.current = false
      observer.disconnect()
    }
  }, [currentEntry, handleEntryStatusUpdate, infoFrom, isSelected, markReadOnScroll, polyglot])

  useEffect(() => {
    if (!shouldPreload || isSelected) {
      return
    }

    for (const imageSource of getEntryImageSources(entry)) {
      void preloadImageMetadata(imageSource)
    }
  }, [entry, isSelected, shouldPreload])

  // Freeze/unfreeze media loading when navigating away from / back to this card.
  // When the user presses J/K to move past a card, this cancels incomplete image
  // downloads and iframe loading. Prevents wasted bandwidth and layout shifts from
  // images loading in cards the user has already scrolled past.
  // Only applies to cards that were previously selected — cards that were never
  // active are left alone so their content can load normally.
  useEffect(() => {
    if (isSelected) {
      wasEverSelectedRef.current = true
    }
  }, [isSelected])

  useEffect(() => {
    const body = cardRef.current?.querySelector(".article-content")
    return observeIframeLoadState(body)
  }, [currentEntry.id, isSelected, streamRenderSelectedOnly])

  useLayoutEffect(() => {
    if (isSelected || !wasEverSelectedRef.current) {
      return
    }

    // Scope to .article-content to avoid freezing the feed icon in the header
    const body = cardRef.current?.querySelector(".article-content")
    if (!body) {
      return
    }

    freezeMediaLoading(body)
    return () => unfreezeMediaLoading(body)
  }, [isSelected])

  const selectEntry = () => {
    if (!isSelected) {
      streamDebug("nav:card-click", { targetEntryId: entry.id })
      handleEntryClick(entry)
    }
  }

  const handleCardClick = (event) => {
    if (isSelected) {
      return
    }

    if (isInteractiveTarget(event.target)) {
      return
    }

    if (hasCombinedSelection()) {
      return
    }

    selectEntry()
  }

  const card = (
    <article
      ref={cardRef}
      data-entry-id={entry.id}
      // The settle gate in StoryStream measures each list item's outermost
      // element; in timeline mode that is the timeline row, not the card.
      data-stream-item={isTimeline ? undefined : ""}
      tabIndex={isSelected ? -1 : 0}
      className={[
        "card-wrapper stream-story-card",
        isCentered ? "stream-story-align-center" : "stream-story-align-left",
        titleAlignment === "justify" && "article-text-justify",
        isSelected && "selected",
        !isUnread && "stream-story-card-read",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={handleCardClick}
      onKeyDown={(event) => {
        if (isSelected) {
          return
        }

        if ((event.key === "Enter" || event.key === " ") && !isInteractiveTarget(event.target)) {
          event.preventDefault()
          selectEntry()
        }
      }}
    >
      {cardIconBackdrop !== "off" && (
        <CardIconBackdrop feed={currentEntry.feed} variant={cardIconBackdrop} />
      )}
      <div className="stream-story-main">
        <ArticleEyebrow
          centered={isCentered}
          entry={currentEntry}
          hideTime={isTimeline}
          maxWidth={contentMaxWidth}
        />
        <Typography.Title
          className={titleClassName}
          heading={4}
          style={{ maxWidth: contentMaxWidth, textAlign: isCentered ? "center" : "left" }}
        >
          {/* Real anchor so middle-click, Ctrl/Cmd-click and "Open in new tab" work natively;
              a <button> here made middle-click trigger the browser's autoscroll instead. */}
          <a
            className="stream-story-title-link"
            href={currentEntry.url}
            rel="noopener noreferrer"
            target="_blank"
            onClick={(event) => {
              event.stopPropagation()
              // Native links handle selection drags; existing selections must not block opening.
            }}
          >
            <span className="stream-story-title-text">{currentEntry.title}</span>
          </a>
        </Typography.Title>
        <div className="stream-story-combined">
          {isSelected || !streamRenderSelectedOnly ? (
            <ArticleBodyRenderer
              key={currentEntry.id}
              entry={currentEntry}
              imageLayout={streamImageLayout}
              maxWidth={contentMaxWidth}
            />
          ) : (
            <p className="stream-story-preview" style={{ maxWidth: contentMaxWidth }}>
              {previewText}
            </p>
          )}
        </div>
      </div>
      <StreamCardFooter entry={currentEntry} isSelected={isSelected} />
    </article>
  )

  if (!isTimeline) {
    return card
  }

  return (
    <div className="stream-timeline-item" data-stream-item="">
      {showDayHeader ? (
        <h3 className="stream-timeline-day">{generateDayLabel(timelineDate)}</h3>
      ) : null}
      <div className="stream-timeline-row">
        <time
          className={isSelected ? "stream-timeline-time is-selected" : "stream-timeline-time"}
          dateTime={timelineDate}
          title={generateReadableDate(timelineDate)}
        >
          {generateClockTime(timelineDate)}
        </time>
        <span
          aria-hidden="true"
          className={isUnread ? "stream-timeline-node is-unread" : "stream-timeline-node"}
        />
        {card}
      </div>
    </div>
  )
}

export default memo(StreamArticleCard)
