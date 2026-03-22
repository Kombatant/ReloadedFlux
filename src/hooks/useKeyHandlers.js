import { useStore } from "@nanostores/react"
import { useEffect, useRef } from "react"

import { polyglotState } from "./useLanguage"
import useModalToggle from "./useModalToggle"
import usePhotoSlider from "./usePhotoSlider"

import useContentContext from "@/hooks/useContentContext"
import { contentState, filteredEntriesState } from "@/store/contentState"
import { settingsState } from "@/store/settingsState"
import { ANIMATION_DURATION_MS } from "@/utils/constants"
import { Message } from "@/utils/feedback"
import { extractImageSources } from "@/utils/images"

const STREAM_CARD_TOP_OFFSET_FALLBACK = 18
const STREAM_SCROLL_ALIGNMENT_TOLERANCE = 4
const STREAM_SCROLL_INITIAL_ALIGNMENT_DELAY_MS = 140
const STREAM_SCROLL_MAX_SETTLE_TIME_MS = 1800
const STREAM_SCROLL_STABLE_FRAME_TARGET = 6

const getStreamCardTopOffset = (scrollElement) => {
  const computedStyle = globalThis.getComputedStyle(scrollElement)
  const scrollPaddingTop =
    computedStyle.scrollPaddingTop || computedStyle.scrollPaddingBlockStart || ""
  const parsedOffset = Number.parseFloat(scrollPaddingTop)

  return Number.isFinite(parsedOffset) ? parsedOffset : STREAM_CARD_TOP_OFFSET_FALLBACK
}

const getStreamCardScrollTop = (selectedCard, scrollElement) => {
  const containerRect = scrollElement.getBoundingClientRect()
  const selectedRect = selectedCard.getBoundingClientRect()
  const topOffset = getStreamCardTopOffset(scrollElement)

  return Math.max(0, scrollElement.scrollTop + selectedRect.top - containerRect.top - topOffset)
}

const scrollStreamCardIntoView = (selectedCard, scrollElement, behavior = "smooth") => {
  scrollElement.scrollTo({
    behavior,
    top: getStreamCardScrollTop(selectedCard, scrollElement),
  })
}

const getStreamCardTopDelta = (selectedCard, scrollElement) => {
  const containerRect = scrollElement.getBoundingClientRect()
  const selectedRect = selectedCard.getBoundingClientRect()
  const topOffset = getStreamCardTopOffset(scrollElement)

  return Math.abs(selectedRect.top - containerRect.top - topOffset)
}

const focusStreamCard = (cardElement) => {
  if (document.activeElement === cardElement) {
    return
  }

  cardElement.focus({ preventScroll: true })
}

const findAdjacentUnreadEntry = (currentEntryId, direction, entries) => {
  const currentIndex = entries.findIndex((entry) => entry.id === currentEntryId)
  if (currentIndex === -1) {
    return null
  }

  const isSearchingBackward = direction === "prev"
  const searchRange = isSearchingBackward
    ? entries.slice(0, currentIndex).toReversed()
    : entries.slice(currentIndex + 1)

  return searchRange.find((entry) => entry.status === "unread")
}

const useKeyHandlers = () => {
  const { activeContent } = useStore(contentState)
  const { polyglot } = useStore(polyglotState)

  const { entryListRef, handleEntryClick, closeActiveContent, streamVirtualizerRef } =
    useContentContext()
  const streamAlignmentTaskRef = useRef({
    delayTimeoutId: null,
    frameId: null,
    maxTimeoutId: null,
    resizeObserver: null,
    sessionId: 0,
  })

  const clearPendingStreamAlignment = () => {
    const task = streamAlignmentTaskRef.current

    if (task.frameId !== null) {
      globalThis.cancelAnimationFrame(task.frameId)
      task.frameId = null
    }

    if (task.delayTimeoutId !== null) {
      globalThis.clearTimeout(task.delayTimeoutId)
      task.delayTimeoutId = null
    }

    if (task.maxTimeoutId !== null) {
      globalThis.clearTimeout(task.maxTimeoutId)
      task.maxTimeoutId = null
    }

    if (task.resizeObserver) {
      task.resizeObserver.disconnect()
      task.resizeObserver = null
    }
  }

  useEffect(() => clearPendingStreamAlignment, [])

  const getEntryListScrollElement = () => {
    if (!entryListRef.current) {
      return null
    }

    return entryListRef.current.getScrollElement?.() || entryListRef.current.contentWrapperEl
  }

  const getSelectedCard = (targetEntryId = null) => {
    if (!entryListRef.current?.el) {
      return null
    }

    if (targetEntryId !== null) {
      return entryListRef.current.el.querySelector(`[data-entry-id="${targetEntryId}"]`) || null
    }

    return entryListRef.current.el.querySelector(".card-wrapper.selected") || null
  }

  const getAdjacentEntry = (direction) => {
    const { activeContent: latestActiveContent } = contentState.get()
    if (!latestActiveContent) {
      return null
    }

    const entries = filteredEntriesState.get()
    const currentIndex = entries.findIndex((entry) => entry.id === latestActiveContent.id)
    if (currentIndex === -1) {
      return null
    }

    const step = direction === "prev" ? -1 : 1
    return entries[currentIndex + step] ?? null
  }

  const alignSelectedStreamCard = (targetEntryId = null, { skipInitialScroll = false } = {}) => {
    clearPendingStreamAlignment()

    const task = streamAlignmentTaskRef.current
    const sessionId = task.sessionId + 1
    let hasAppliedInitialScroll = false
    let stableFrameCount = 0

    task.sessionId = sessionId

    const isCurrentSession = () => streamAlignmentTaskRef.current.sessionId === sessionId

    task.maxTimeoutId = globalThis.setTimeout(() => {
      if (!isCurrentSession()) {
        return
      }

      clearPendingStreamAlignment()
    }, STREAM_SCROLL_MAX_SETTLE_TIME_MS)

    const ensureResizeObserver = (selectedCard) => {
      if (streamAlignmentTaskRef.current.resizeObserver || typeof ResizeObserver !== "function") {
        return
      }

      const observer = new ResizeObserver(() => {
        if (!isCurrentSession()) {
          return
        }

        stableFrameCount = 0

        if (streamAlignmentTaskRef.current.frameId !== null) {
          globalThis.cancelAnimationFrame(streamAlignmentTaskRef.current.frameId)
        }

        streamAlignmentTaskRef.current.frameId = globalThis.requestAnimationFrame(settleAlignment)
      })

      observer.observe(selectedCard)
      streamAlignmentTaskRef.current.resizeObserver = observer
    }

    function settleAlignment() {
      if (!isCurrentSession()) {
        return
      }

      const selectedCard = getSelectedCard(targetEntryId)
      const scrollElement = getEntryListScrollElement()

      if (!selectedCard || !scrollElement) {
        streamAlignmentTaskRef.current.frameId = globalThis.requestAnimationFrame(settleAlignment)
        return
      }

      ensureResizeObserver(selectedCard)
      focusStreamCard(selectedCard)

      if (!hasAppliedInitialScroll) {
        hasAppliedInitialScroll = true
        stableFrameCount = 0
        if (!skipInitialScroll) {
          scrollStreamCardIntoView(selectedCard, scrollElement)
        }
        streamAlignmentTaskRef.current.delayTimeoutId = globalThis.setTimeout(() => {
          if (!isCurrentSession()) {
            return
          }

          streamAlignmentTaskRef.current.delayTimeoutId = null
          streamAlignmentTaskRef.current.frameId = globalThis.requestAnimationFrame(settleAlignment)
        }, STREAM_SCROLL_INITIAL_ALIGNMENT_DELAY_MS)
        return
      }

      const topDelta = getStreamCardTopDelta(selectedCard, scrollElement)

      if (topDelta > STREAM_SCROLL_ALIGNMENT_TOLERANCE) {
        scrollStreamCardIntoView(selectedCard, scrollElement, "auto")
        stableFrameCount = 0
      } else {
        stableFrameCount += 1
      }

      if (stableFrameCount >= STREAM_SCROLL_STABLE_FRAME_TARGET) {
        clearPendingStreamAlignment()
        return
      }

      streamAlignmentTaskRef.current.frameId = globalThis.requestAnimationFrame(settleAlignment)
    }

    streamAlignmentTaskRef.current.frameId = globalThis.requestAnimationFrame(settleAlignment)
  }

  const scrollSelectedCardIntoView = (targetEntryId = null) => {
    if (entryListRef.current) {
      const scrollElement = getEntryListScrollElement()
      const topOffset = scrollElement ? getStreamCardTopOffset(scrollElement) : 0
      const selectedCard = getSelectedCard(targetEntryId)

      if (settingsState.get().layoutMode === "stream" && scrollElement && selectedCard) {
        alignSelectedStreamCard(targetEntryId)
        return
      }

      if (targetEntryId !== null && streamVirtualizerRef.current) {
        const targetIndex = filteredEntriesState
          .get()
          .findIndex((entry) => entry.id === Number(targetEntryId))

        if (targetIndex !== -1) {
          streamVirtualizerRef.current.scrollToIndex(targetIndex, {
            align: "start",
            offset: -topOffset,
            smooth: true,
          })
        }
      }

      if (selectedCard) {
        if (settingsState.get().layoutMode === "stream" && scrollElement) {
          alignSelectedStreamCard(targetEntryId, { skipInitialScroll: true })
          return
        }

        selectedCard.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      }
    }
  }

  const { isPhotoSliderVisible, setIsPhotoSliderVisible, setSelectedIndex } = usePhotoSlider()
  const { setSettingsModalVisible, setSettingsTabsActiveTab } = useModalToggle()

  const withActiveContent =
    (fn) =>
    (...args) => {
      if (activeContent) {
        return fn(...args)
      }
    }

  const withPhotoSliderCheck =
    (fn) =>
    (...args) => {
      if (isPhotoSliderVisible) {
        return
      }
      return fn(...args)
    }

  const exitDetailView = withActiveContent(
    // eslint-disable-next-line react-hooks/refs
    withPhotoSliderCheck(() => {
      closeActiveContent()
      if (entryListRef.current) {
        entryListRef.current.contentWrapperEl.focus()
      }
    }),
  )

  // eslint-disable-next-line react-hooks/refs
  const navigateToPreviousArticle = withPhotoSliderCheck(() => {
    const previousContent = getAdjacentEntry("prev")

    if (previousContent) {
      handleEntryClick(previousContent)

      if (settingsState.get().layoutMode === "stream") {
        globalThis.requestAnimationFrame(() => scrollSelectedCardIntoView(previousContent.id))
      } else {
        globalThis.setTimeout(() => scrollSelectedCardIntoView(), ANIMATION_DURATION_MS)
      }
    } else {
      Message.info(polyglot.t("actions.no_previous_article"))
    }
  })

  // eslint-disable-next-line react-hooks/refs
  const navigateToNextArticle = withPhotoSliderCheck(() => {
    const nextContent = getAdjacentEntry("next")

    if (nextContent) {
      handleEntryClick(nextContent)

      if (settingsState.get().layoutMode === "stream") {
        globalThis.requestAnimationFrame(() => scrollSelectedCardIntoView(nextContent.id))
      } else {
        globalThis.setTimeout(() => scrollSelectedCardIntoView(), ANIMATION_DURATION_MS)
      }
    } else {
      Message.info(polyglot.t("actions.no_next_article"))
    }
  })

  // eslint-disable-next-line react-hooks/refs
  const navigateToAdjacentUnreadArticle = withPhotoSliderCheck((direction) => {
    const { activeContent: latestActiveContent } = contentState.get()
    const filteredEntries = filteredEntriesState.get()
    if (!latestActiveContent) {
      return
    }

    const adjacentUnreadEntry = findAdjacentUnreadEntry(
      latestActiveContent.id,
      direction,
      filteredEntries,
    )
    if (adjacentUnreadEntry) {
      handleEntryClick(adjacentUnreadEntry)

      if (settingsState.get().layoutMode === "stream") {
        globalThis.requestAnimationFrame(() => scrollSelectedCardIntoView(adjacentUnreadEntry.id))
      } else {
        globalThis.setTimeout(scrollSelectedCardIntoView, ANIMATION_DURATION_MS)
      }
    } else if (direction === "prev") {
      Message.info(polyglot.t("actions.no_previous_unread_article"))
    } else {
      Message.info(polyglot.t("actions.no_next_unread_article"))
    }
  })

  const navigateToPreviousUnreadArticle = () => navigateToAdjacentUnreadArticle("prev")
  const navigateToNextUnreadArticle = () => navigateToAdjacentUnreadArticle("next")

  const openLinkExternally = withActiveContent(() => {
    window.open(activeContent.url, "_blank")
  })

  const fetchOriginalArticle = withActiveContent((handleFetchContent) => {
    handleFetchContent()
  })

  const saveToThirdPartyServices = withActiveContent((handleSaveToThirdPartyServices) => {
    handleSaveToThirdPartyServices()
  })

  const showHotkeysSettings = () => {
    setSettingsTabsActiveTab("6")
    setSettingsModalVisible(true)
  }

  const toggleReadStatus = withActiveContent((handleUpdateEntry) => {
    handleUpdateEntry()
  })

  const toggleStarStatus = withActiveContent((handleStarEntry) => {
    handleStarEntry()
  })

  const openPhotoSlider = withActiveContent(() => {
    if (isPhotoSliderVisible) {
      setIsPhotoSliderVisible(false)
      return
    }

    const imageSources = activeContent.imageSources ?? extractImageSources(activeContent.content)
    if (imageSources.length === 0) {
      return
    }

    setSelectedIndex(0)
    setIsPhotoSliderVisible(true)
  })

  return {
    exitDetailView,
    fetchOriginalArticle,
    navigateToNextArticle,
    navigateToNextUnreadArticle,
    navigateToPreviousArticle,
    navigateToPreviousUnreadArticle,
    openLinkExternally,
    openPhotoSlider,
    saveToThirdPartyServices,
    showHotkeysSettings,
    toggleReadStatus,
    toggleStarStatus,
  }
}

export default useKeyHandlers
