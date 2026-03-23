import { Button, Typography } from "@arco-design/web-react"
import { IconEmpty, IconLeft, IconRight } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { AnimatePresence } from "framer-motion"
import { useCallback, useEffect, useRef, useState } from "react"
import { useLocation, useParams } from "react-router"
import { useSwipeable } from "react-swipeable"

import FooterPanel from "./FooterPanel"
import StoryStream from "./StoryStream"

import { getEntry } from "@/apis"
import ActionButtons from "@/components/Article/ActionButtons"
import ArticleDetail from "@/components/Article/ArticleDetail"
import ArticleList from "@/components/Article/ArticleList"
import SearchAndSortBar from "@/components/Article/SearchAndSortBar"
import FadeTransition from "@/components/ui/FadeTransition"
import useAppData from "@/hooks/useAppData"
import useArticleList from "@/hooks/useArticleList"
import useContentContext from "@/hooks/useContentContext"
import useContentHotkeys from "@/hooks/useContentHotkeys"
import useDocumentTitle from "@/hooks/useDocumentTitle"
import useKeyHandlers from "@/hooks/useKeyHandlers"
import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import {
  contentState,
  filteredEntriesState,
  setActiveContent,
  setInfoFrom,
  setInfoId,
  setIsArticleLoading,
} from "@/store/contentState"
import { dataState } from "@/store/dataState"
import { duplicateHotkeysState } from "@/store/hotkeysState"
import { settingsState, updateSettings } from "@/store/settingsState"
import { Notification } from "@/utils/feedback"
import { parseCoverImage } from "@/utils/images"

import "./Content.css"

const Content = ({ info, getEntries, markAllAsRead }) => {
  const { activeContent, entries, filterDate, filterString, isArticleLoading } =
    useStore(contentState)
  const { isAppDataReady } = useStore(dataState)
  const {
    enableSwipeGesture,
    entryListWidth: storedEntryListWidth,
    layoutMode,
    orderBy,
    orderDirection,
    showStatus,
    swipeSensitivity,
  } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)
  const duplicateHotkeys = useStore(duplicateHotkeysState)

  const [isSwipingLeft, setIsSwipingLeft] = useState(false)
  const [isSwipingRight, setIsSwipingRight] = useState(false)
  const cardsRef = useRef(null)

  const location = useLocation()
  const params = useParams()
  const { entryId } = params

  useDocumentTitle()

  const { entryDetailRef, entryListRef, handleEntryClick, streamVirtualizerRef } =
    useContentContext()

  const { navigateToNextArticle, navigateToPreviousArticle, showHotkeysSettings } = useKeyHandlers()

  const { fetchAppData, fetchFeedRelatedData } = useAppData()
  const { fetchArticleList } = useArticleList(info)
  const { isBelowMedium } = useScreenWidth()

  const [entryListWidth, setEntryListWidth] = useState(storedEntryListWidth ?? 420)
  const [isResizingEntryList, setIsResizingEntryList] = useState(false)
  const contentSplitRef = useRef(null)
  const getEntriesRef = useRef(getEntries)
  const handleEntryClickRef = useRef(handleEntryClick)
  const lastLoadedInfoKeyRef = useRef(null)

  useEffect(() => {
    getEntriesRef.current = getEntries
  }, [getEntries])

  useEffect(() => {
    handleEntryClickRef.current = handleEntryClick
  }, [handleEntryClick])

  const focusStreamCard = useCallback(
    (entryId, options = {}) => {
      const { resetScroll = false } = options
      if (layoutMode !== "stream" || isBelowMedium) {
        return
      }

      const focusSelectedCard = (attempt = 0) => {
        const entryList = entryListRef.current
        if (!entryList) {
          if (attempt < 8) {
            globalThis.requestAnimationFrame(() => focusSelectedCard(attempt + 1))
          }
          return
        }

        const scrollElement = entryList.getScrollElement?.() || entryList.contentWrapperEl
        if (scrollElement && resetScroll) {
          scrollElement.scrollTo({ top: 0, behavior: "auto" })
        }

        const selectedCard =
          entryList.el?.querySelector(`[data-entry-id="${entryId}"]`) ||
          entryList.el?.querySelector(".card-wrapper.selected")
        if (selectedCard) {
          selectedCard.focus({ preventScroll: true })
          return
        }

        if (attempt < 8) {
          globalThis.requestAnimationFrame(() => focusSelectedCard(attempt + 1))
        }
      }

      globalThis.requestAnimationFrame(() => focusSelectedCard())
    },
    [entryListRef, isBelowMedium, layoutMode],
  )

  const selectFirstEntry = useCallback(() => {
    const firstEntry = filteredEntriesState.get()[0]

    if (!firstEntry) {
      setActiveContent(null)
      return
    }

    handleEntryClickRef.current(firstEntry)
    focusStreamCard(firstEntry.id, { resetScroll: true })
  }, [focusStreamCard])

  const fetchArticleListOnly = useCallback(async () => {
    if (!isAppDataReady) {
      await fetchAppData()
    }

    await fetchArticleList(getEntriesRef.current)
  }, [isAppDataReady, fetchArticleList, fetchAppData])

  const fetchArticleListWithRelatedData = useCallback(async () => {
    if (!isAppDataReady) {
      await fetchAppData()
    }

    await fetchArticleList(getEntriesRef.current)
    if (isAppDataReady) {
      await fetchFeedRelatedData()
    }
  }, [isAppDataReady, fetchAppData, fetchArticleList, fetchFeedRelatedData])

  const fetchSingleEntry = useCallback(
    async (targetEntryId) => {
      const existingEntry = entries.find((entry) => entry.id === Number(targetEntryId))

      if (existingEntry) {
        setActiveContent(existingEntry)
        return
      }

      try {
        setIsArticleLoading(true)
        const entry = parseCoverImage(await getEntry(targetEntryId))
        setActiveContent(entry)
      } catch (error) {
        console.error("Failed to fetch entry:", error)
      } finally {
        setIsArticleLoading(false)
      }
    },
    [entries],
  )

  useContentHotkeys({ handleRefreshArticleList: fetchArticleListWithRelatedData })

  const handleSwiping = (eventData) => {
    setIsSwipingLeft(eventData.dir === "Left")
    setIsSwipingRight(eventData.dir === "Right")
  }

  const handleSwiped = () => {
    setIsSwipingLeft(false)
    setIsSwipingRight(false)
  }

  const handleSwipeLeft = useCallback(() => navigateToNextArticle(), [navigateToNextArticle])

  const handleSwipeRight = useCallback(
    () => navigateToPreviousArticle(),
    [navigateToPreviousArticle],
  )

  const handlers = useSwipeable({
    delta: 50 / swipeSensitivity,
    onSwiping: enableSwipeGesture
      ? (eventData) => {
          if (globalThis.getSelection().toString()) {
            return
          }
          handleSwiping(eventData)
        }
      : undefined,
    onSwiped: enableSwipeGesture ? handleSwiped : undefined,
    onSwipedLeft: enableSwipeGesture ? handleSwipeLeft : undefined,
    onSwipedRight: enableSwipeGesture ? handleSwipeRight : undefined,
  })

  useEffect(() => {
    if (duplicateHotkeys.length > 0) {
      const id = "duplicate-hotkeys"
      Notification.error({
        id,
        title: polyglot.t("settings.duplicate_hotkeys"),
        duration: 0,
        btn: (
          <span>
            <Button
              size="small"
              style={{ marginRight: 8 }}
              type="secondary"
              onClick={() => Notification.remove(id)}
            >
              {polyglot.t("actions.dismiss")}
            </Button>
            <Button
              size="small"
              type="primary"
              onClick={() => {
                showHotkeysSettings()
                Notification.remove(id)
              }}
            >
              {polyglot.t("actions.check")}
            </Button>
          </span>
        ),
      })
    }
  }, [duplicateHotkeys, polyglot, showHotkeysSettings])

  useEffect(() => {
    let isCancelled = false

    const loadEntriesForSidebarSelection = async () => {
      const infoKey = `${info.from}:${info.id ?? ""}`
      if (lastLoadedInfoKeyRef.current === infoKey) {
        return
      }

      lastLoadedInfoKeyRef.current = infoKey
      setInfoFrom(info.from)
      setInfoId(info.id)
      setActiveContent(null)

      await (info.from === "category" ? fetchArticleListWithRelatedData() : fetchArticleListOnly())

      if (!isCancelled && !entryId) {
        selectFirstEntry()
      }
    }

    loadEntriesForSidebarSelection()

    return () => {
      isCancelled = true
    }
  }, [
    entryId,
    fetchArticleListOnly,
    fetchArticleListWithRelatedData,
    info.from,
    info.id,
    selectFirstEntry,
  ])

  useEffect(() => {
    if (["starred", "history"].includes(info.from)) {
      return
    }
    fetchArticleListOnly()
  }, [fetchArticleListOnly, info.from, orderBy])

  useEffect(() => {
    fetchArticleListOnly()
  }, [fetchArticleListOnly, filterDate, filterString, orderDirection, showStatus])

  useEffect(() => {
    if (isBelowMedium && activeContent && !entryId) {
      setActiveContent(null)
    }
  }, [activeContent, entryId, isBelowMedium, location.pathname])

  useEffect(() => {
    if (entryId) {
      if (!activeContent || activeContent.id !== Number(entryId)) {
        fetchSingleEntry(entryId)
      }
    } else if (activeContent) {
      setActiveContent(null)
    }
  }, [activeContent, entryId, fetchSingleEntry])

  const handleEntryListSplitterPointerDown = (event) => {
    if (isBelowMedium) {
      return
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      return
    }

    const container = contentSplitRef.current
    if (!container) {
      return
    }

    event.preventDefault()

    const startX = event.clientX
    const startWidth = entryListWidth
    let latestWidth = startWidth

    const minWidth = 280
    const minRightPaneWidth = 320
    const splitterSize = 8

    document.body.style.userSelect = "none"
    setIsResizingEntryList(true)

    const handlePointerMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX
      const containerWidth = container.getBoundingClientRect().width
      const maxWidth = Math.max(minWidth, containerWidth - minRightPaneWidth - splitterSize)
      const nextWidth = Math.min(maxWidth, Math.max(minWidth, startWidth + delta))
      latestWidth = nextWidth
      setEntryListWidth(nextWidth)
    }

    const handlePointerUp = () => {
      document.body.style.userSelect = ""
      setIsResizingEntryList(false)
      updateSettings({ entryListWidth: latestWidth })
      globalThis.removeEventListener("pointermove", handlePointerMove)
      globalThis.removeEventListener("pointerup", handlePointerUp)
    }

    globalThis.addEventListener("pointermove", handlePointerMove)
    globalThis.addEventListener("pointerup", handlePointerUp)
  }

  const shouldUseStoryStream = layoutMode === "stream" && !isBelowMedium

  if (shouldUseStoryStream) {
    return (
      <div ref={contentSplitRef} className="content-split">
        <StoryStream
          cardsRef={cardsRef}
          entryListRef={entryListRef}
          getEntries={getEntries}
          handleEntryClick={handleEntryClick}
          info={info}
          markAllAsRead={markAllAsRead}
          refreshArticleList={fetchArticleListWithRelatedData}
          streamVirtualizerRef={streamVirtualizerRef}
        />
      </div>
    )
  }

  return (
    <div ref={contentSplitRef} className="content-split">
      <div
        className="entry-col"
        style={{
          opacity: isBelowMedium && isArticleLoading ? 0 : 1,
          width: isBelowMedium ? undefined : entryListWidth,
        }}
      >
        <SearchAndSortBar
          info={info}
          markAllAsRead={markAllAsRead}
          refreshArticleList={fetchArticleListWithRelatedData}
          variant="classic"
        />
        <ArticleList
          ref={entryListRef}
          cardsRef={cardsRef}
          getEntries={getEntries}
          handleEntryClick={handleEntryClick}
        />
        <FooterPanel
          info={info}
          markAllAsRead={markAllAsRead}
          refreshArticleList={fetchArticleListWithRelatedData}
        />
      </div>
      {isBelowMedium ? null : (
        <div
          aria-label="Resize entry list"
          aria-orientation="vertical"
          role="separator"
          className={
            isResizingEntryList
              ? "pane-splitter content-splitter is-dragging"
              : "pane-splitter content-splitter"
          }
          onPointerDown={handleEntryListSplitterPointerDown}
        />
      )}
      {activeContent ? (
        <div
          className="article-container content-wrapper"
          style={isBelowMedium ? undefined : { flex: 1, minWidth: 0 }}
          {...handlers}
        >
          {!isBelowMedium && <ActionButtons />}
          {isArticleLoading ? (
            <div style={{ flex: 1 }} />
          ) : (
            <>
              <AnimatePresence>
                {isSwipingRight && (
                  <FadeTransition key="swipe-hint-left" className="swipe-hint left">
                    <IconLeft style={{ fontSize: 24 }} />
                  </FadeTransition>
                )}
                {isSwipingLeft && (
                  <FadeTransition key="swipe-hint-right" className="swipe-hint right">
                    <IconRight style={{ fontSize: 24 }} />
                  </FadeTransition>
                )}
              </AnimatePresence>
              <ArticleDetail ref={entryDetailRef} />
            </>
          )}
          {isBelowMedium && <ActionButtons />}
        </div>
      ) : (
        <div
          className="content-empty content-wrapper"
          style={isBelowMedium ? undefined : { flex: 1, minWidth: 0 }}
        >
          <IconEmpty style={{ fontSize: "64px" }} />
          <Typography.Title heading={6} style={{ color: "var(--color-text-3)", marginTop: "10px" }}>
            ReloadedFlux
          </Typography.Title>
        </div>
      )}
    </div>
  )
}

export default Content
