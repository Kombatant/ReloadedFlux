import { Avatar, Button } from "@arco-design/web-react"
import { IconArrowRight, IconCheck, IconEye, IconRefresh } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { throttle } from "lodash-es"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import SimpleBar from "simplebar-react"
import { Virtualizer } from "virtua"

import ContentToolbar, { StreamNavButtons } from "@/components/Article/ContentToolbar"
import LoadingCards from "@/components/Article/LoadingCards"
import StreamArticleCard from "@/components/Article/StreamArticleCard"
import ReloadedFluxIcon from "@/components/icons/ReloadedFluxIcon"
import EmptyState from "@/components/ui/EmptyState"
import LoadMore from "@/components/ui/LoadMore"
import { polyglotState } from "@/hooks/useLanguage"
import useLoadMore from "@/hooks/useLoadMore"
import { contentState, filteredEntriesState } from "@/store/contentState"
import { categoriesState, feedsState } from "@/store/dataState"
import { settingsState, updateSettings } from "@/store/settingsState"
import { streamAlignmentActiveState } from "@/store/streamAlignmentState"
import { getDayKey } from "@/utils/date"
import { streamDebug } from "@/utils/stream-debug"

import "./StoryStream.css"

const STREAM_PRELOAD_AHEAD_COUNT = 3
const STREAM_VIRTUAL_OVERSCAN = 6
const STREAM_LOAD_MORE_REMAINING_ITEMS = 20

const StoryStream = ({
  cardsRef,
  entryListRef,
  getEntries,
  handleEntryClick,
  info,
  markAllAsRead,
  onNavigateNext,
  streamVirtualizerRef,
}) => {
  const { activeContent, infoFrom, isArticleListReady, loadMoreVisible } = useStore(contentState)
  const filteredEntries = useStore(filteredEntriesState)
  const feeds = useStore(feedsState)
  const categories = useStore(categoriesState)
  const { animationsEnabled, orderBy, showStatus, streamTimeline } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)
  const navigate = useNavigate()
  const { loadingMore, handleLoadMore } = useLoadMore()
  const canLoadMore = loadMoreVisible && isArticleListReady && !loadingMore

  const checkAndLoadMore = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs -- runs only from scroll events / alignment listener, never during render
      throttle(() => {
        if (!canLoadMore) {
          return
        }

        // Never request an append while the alignment glide is running: the
        // 300-entry remeasure lands mid-scroll and knocks the animated scroll
        // off target. The alignment-state listener below re-checks the moment
        // the glide finishes, so nothing is lost by skipping here.
        if (streamAlignmentActiveState.get()) {
          return
        }

        const virtualizer = streamVirtualizerRef.current
        if (!virtualizer) {
          return
        }

        // Trigger on remaining *items*, not a scrollHeight percentage. In a
        // virtualized list unmounted cards are only estimated (far smaller
        // than they render), so a ratio against scrollHeight saturates while
        // the user is still near the top of the loaded list — load-more then
        // re-fires on every scroll event and fetches the entire backlog.
        const lastVisibleIndex = virtualizer.findItemIndex(
          virtualizer.scrollOffset + virtualizer.viewportSize,
        )
        const loadedCount = filteredEntriesState.get().length
        const remainingItems = loadedCount - 1 - lastVisibleIndex

        if (remainingItems <= STREAM_LOAD_MORE_REMAINING_ITEMS) {
          streamDebug("stream:load-more-triggered", {
            lastVisibleIndex,
            loadedCount,
            remainingItems,
          })
          handleLoadMore(getEntries)
        }
      }, 200),
    [canLoadMore, getEntries, handleLoadMore, streamVirtualizerRef],
  )

  useEffect(() => {
    return () => checkAndLoadMore.cancel()
  }, [checkAndLoadMore])

  // Keyboard navigation produces scroll events only *during* alignment (which
  // the check above skips), so re-check once each alignment session ends —
  // otherwise a keyboard-only user would never trigger load-more.
  useEffect(() => {
    const unbind = streamAlignmentActiveState.listen((active) => {
      if (!active) {
        checkAndLoadMore()
      }
    })
    return unbind
  }, [checkAndLoadMore])

  const hasEntries = filteredEntries.length > 0

  // virtua lays out the next card from an *estimated* size for the (expanded,
  // selected) first card before it has measured it, so on a fresh category swap
  // card #2 briefly paints at ~40px down — overlapping the tall selected card as
  // a floating ghost — until the ResizeObserver remeasures (the 1-2s flash).
  // Keep the freshly-mounted list invisible but in its final layout while virtua
  // measures it. Reveal once the cards AND footer no longer overlap; a single
  // short card can overlap the footer even though there is no second card.
  //
  // Keyed to list *identity* (source + ready flip), NOT filteredEntries.length:
  // background load-more appends (and mark-as-read removals under the unread
  // filter) change the length without remounting the list. Re-hiding on those
  // set visibility:hidden on the focused card — which blurs it to <body> and
  // clamps the collapsed scroller back to scrollTop 0 — so keyboard navigation
  // intermittently "lost" the just-selected article. Appended cards mount far
  // below the viewport, so the first-card overlap glitch can't occur there.
  const settleKey = `${info.from}:${info.id}:${isArticleListReady}`
  const [streamSettled, setStreamSettled] = useState(false)
  const [settledKey, setSettledKey] = useState(settleKey)
  // Adjust state during render when the list identity changes (the React-blessed
  // "derive state from props" pattern), so the new list never paints in its
  // unsettled state for even one frame.
  if (settledKey !== settleKey) {
    streamDebug("stream:list-identity-changed", { from: settledKey, to: settleKey })
    setSettledKey(settleKey)
    setStreamSettled(false)
  }

  useEffect(() => {
    if (!isArticleListReady || !hasEntries) {
      return
    }

    let stopped = false
    let frame = 0
    const MAX_FRAMES = 40 // ~0.6s safety: always reveal even if measure never "settles".

    const isLaidOut = () => {
      const scroller = entryListRef.current?.getScrollElement?.()
      if (!scroller) {
        return false
      }
      const scRect = scroller.getBoundingClientRect()
      const items = [
        ...scroller.querySelectorAll(
          "[data-stream-item], .story-stream-end, .story-stream-load-more",
        ),
      ]
      if (items.length === 0) {
        return false
      }
      let prevBottom = -Infinity
      for (const item of items) {
        // virtua hides each item until its ResizeObserver has measured it.
        // Check that wrapper, not inherited visibility from our loading guard.
        if (item.parentElement.style.visibility === "hidden") {
          return false
        }
        const rect = item.getBoundingClientRect()
        const top = rect.top - scRect.top
        // Include the end/load-more footer in the overlap check even when the
        // feed contains only one article.
        if (rect.width <= 0 || rect.height <= 0 || top < prevBottom - 4) {
          return false
        }
        prevBottom = rect.bottom - scRect.top
      }
      return true
    }

    const tick = () => {
      if (stopped) {
        return
      }
      frame += 1
      if (isLaidOut() || frame >= MAX_FRAMES) {
        streamDebug("stream:settled", {
          settleKey,
          frames: frame,
          hitFrameCap: frame >= MAX_FRAMES,
        })
        setStreamSettled(true)
        return
      }
      requestAnimationFrame(tick)
    }
    // Start after the current paint so virtua has mounted its children.
    const raf = requestAnimationFrame(tick)
    return () => {
      stopped = true
      cancelAnimationFrame(raf)
    }
  }, [settleKey, isArticleListReady, hasEntries, entryListRef])

  // End-of-feed footer min-height so the last few cards can still top-align: at the
  // end of the feed, selecting the final cards must move them to the top. Without
  // trailing room virtua can't scroll a low card up. The footer fills the scroll
  // viewport height → any card reaches the top, footer content shown below it.
  const [spacerHeight, setSpacerHeight] = useState(0)
  useEffect(() => {
    const element = cardsRef.current
    if (!element) {
      return
    }
    const update = () => setSpacerHeight(element.clientHeight)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [cardsRef, isArticleListReady])

  const activeEntryIndex = useMemo(
    () => filteredEntries.findIndex((entry) => entry.id === activeContent?.id),
    [activeContent?.id, filteredEntries],
  )
  const keepMountedIndexes = useMemo(() => {
    if (activeEntryIndex === -1) {
      return []
    }

    return [activeEntryIndex - 1, activeEntryIndex, activeEntryIndex + 1].filter(
      (index, position, array) =>
        index >= 0 && index < filteredEntries.length && array.indexOf(index) === position,
    )
  }, [activeEntryIndex, filteredEntries.length])

  // Timeline view groups by the sort field so the rail always runs in order.
  const timelineDateField = orderBy === "published_at" ? "published_at" : "created_at"
  const timelineDayKeys = useMemo(
    () =>
      streamTimeline ? filteredEntries.map((entry) => getDayKey(entry[timelineDateField])) : null,
    [filteredEntries, streamTimeline, timelineDateField],
  )

  // Name the feed/category in the end-of-feed subtitle; other views stay generic.
  const sourceTitle = useMemo(() => {
    if (infoFrom === "feed") {
      return feeds.find((feed) => feed.id === Number(info.id))?.title
    }
    if (infoFrom === "category") {
      return categories.find((category) => category.id === Number(info.id))?.title
    }
    return null
  }, [categories, feeds, info.id, infoFrom])

  // End-of-feed content: "all caught up" state + actions. Shown both when the feed
  // is empty (no unread at all) and when scrolling past the last loaded card.
  const isUnreadOnly = showStatus === "unread"
  const canShowRead = isUnreadOnly && (infoFrom === "feed" || infoFrom === "category")
  const refreshFeed = () =>
    globalThis.dispatchEvent(
      new CustomEvent("reloadedflux:refresh", {
        detail: { from: info.from, id: info.id },
      }),
    )

  const streamEndContent = (
    <EmptyState
      icon={<IconCheck />}
      tone="success"
      actions={
        <>
          {canShowRead ? (
            <Button
              icon={<IconEye />}
              type="primary"
              onClick={() => updateSettings({ showStatus: "all" })}
            >
              {polyglot.t("article_list.stream_end_show_read")}
            </Button>
          ) : null}
          <Button
            icon={<IconRefresh />}
            type={canShowRead ? "secondary" : "primary"}
            onClick={refreshFeed}
          >
            {polyglot.t("article_list.stream_end_refresh")}
          </Button>
        </>
      }
      description={
        isUnreadOnly
          ? sourceTitle
            ? polyglot.t("article_list.stream_end_read_everything_in", { title: sourceTitle })
            : polyglot.t("article_list.stream_end_read_everything")
          : null
      }
      footer={
        infoFrom === "all" ? null : (
          <Button className="story-stream-end-link" type="text" onClick={() => navigate("/all")}>
            {polyglot.t("article_list.stream_end_see_all")}
            <IconArrowRight />
          </Button>
        )
      }
      title={polyglot.t(
        isUnreadOnly ? "article_list.stream_end_caught_up" : "article_list.stream_end_reached_end",
      )}
    />
  )

  return (
    <div className="article-container story-stream-layout">
      <div className="story-stream-toolbar">
        <ContentToolbar
          info={info}
          markAllAsRead={markAllAsRead}
          navigation={<StreamNavButtons streamVirtualizerRef={streamVirtualizerRef} />}
          variant="stream"
        />
      </div>
      <SimpleBar
        ref={entryListRef}
        className={`entry-list story-stream-list ${animationsEnabled ? "animations-enabled" : ""}`}
        scrollableNodeProps={{
          ref: cardsRef,
          tabIndex: -1,
        }}
      >
        {/* The loading indicator overlays the hidden list so measuring and
            revealing it use the same width and scroll coordinates. */}
        {!isArticleListReady && <LoadingCards />}
        {isArticleListReady && hasEntries && !streamSettled ? (
          <div aria-busy="true" aria-live="polite" className="story-stream-settling">
            <Avatar className="story-stream-settling-icon" size={48}>
              <ReloadedFluxIcon />
            </Avatar>
          </div>
        ) : null}
        {isArticleListReady && !hasEntries ? (
          <div className="story-stream-end story-stream-end-empty">{streamEndContent}</div>
        ) : null}
        {isArticleListReady && hasEntries ? (
          <div
            className="story-stream-virtualizer"
            style={
              streamSettled
                ? undefined
                : // Keep normal-flow geometry: an absolutely positioned wrapper
                  // with no width collapses during measurement, then reflows on
                  // reveal and can leave stale painted content in short cards.
                  { visibility: "hidden", pointerEvents: "none" }
            }
          >
            <Virtualizer
              ref={streamVirtualizerRef}
              keepMounted={keepMountedIndexes}
              overscan={STREAM_VIRTUAL_OVERSCAN}
              scrollRef={cardsRef}
              onScroll={() => checkAndLoadMore()}
            >
              {filteredEntries.map((entry, index) => (
                <StreamArticleCard
                  key={entry.id}
                  activeEntry={activeContent?.id === entry.id ? activeContent : null}
                  entry={entry}
                  handleEntryClick={handleEntryClick}
                  infoFrom={infoFrom}
                  isSelected={activeContent?.id === entry.id}
                  timelineDate={timelineDayKeys === null ? null : entry[timelineDateField]}
                  shouldPreload={
                    activeEntryIndex !== -1 &&
                    index > activeEntryIndex &&
                    index <= activeEntryIndex + STREAM_PRELOAD_AHEAD_COUNT
                  }
                  showDayHeader={
                    timelineDayKeys !== null &&
                    (index === 0 || timelineDayKeys[index] !== timelineDayKeys[index - 1])
                  }
                  onNavigateNext={onNavigateNext}
                />
              ))}
              {loadMoreVisible ? (
                <LoadMore loading={loadingMore} onLoad={() => handleLoadMore(getEntries)} />
              ) : (
                <div className="story-stream-end" style={{ minHeight: spacerHeight || undefined }}>
                  {streamEndContent}
                </div>
              )}
            </Virtualizer>
          </div>
        ) : null}
      </SimpleBar>
    </div>
  )
}

export default StoryStream
