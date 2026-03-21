import { useStore } from "@nanostores/react"

import { polyglotState } from "./useLanguage"
import useModalToggle from "./useModalToggle"
import usePhotoSlider from "./usePhotoSlider"

import useContentContext from "@/hooks/useContentContext"
import {
  activeEntryIndexState,
  contentState,
  filteredEntriesState,
  nextContentState,
  prevContentState,
} from "@/store/contentState"
import { settingsState } from "@/store/settingsState"
import { ANIMATION_DURATION_MS } from "@/utils/constants"
import { Message } from "@/utils/feedback"
import { extractImageSources } from "@/utils/images"

const STREAM_CARD_TOP_OFFSET = 8
const STREAM_SCROLL_ALIGNMENT_TOLERANCE = 4
const STREAM_SCROLL_RETRY_DELAY_MS = 120

const getStreamCardScrollTop = (selectedCard, scrollElement) => {
  const containerRect = scrollElement.getBoundingClientRect()
  const selectedRect = selectedCard.getBoundingClientRect()

  return Math.max(
    0,
    scrollElement.scrollTop + selectedRect.top - containerRect.top - STREAM_CARD_TOP_OFFSET,
  )
}

const scrollStreamCardIntoView = (selectedCard, scrollElement, behavior = "smooth") => {
  scrollElement.scrollTo({
    behavior,
    top: getStreamCardScrollTop(selectedCard, scrollElement),
  })
}

const findAdjacentUnreadEntry = (currentIndex, direction, entries) => {
  const isSearchingBackward = direction === "prev"
  const searchRange = isSearchingBackward
    ? entries.slice(0, currentIndex).toReversed()
    : entries.slice(currentIndex + 1)

  return searchRange.find((entry) => entry.status === "unread")
}

const useKeyHandlers = () => {
  const { activeContent } = useStore(contentState)
  const { polyglot } = useStore(polyglotState)
  const activeEntryIndex = useStore(activeEntryIndexState)
  const filteredEntries = useStore(filteredEntriesState)
  const prevContent = useStore(prevContentState)
  const nextContent = useStore(nextContentState)
  const { layoutMode } = useStore(settingsState)

  const { entryListRef, handleEntryClick, closeActiveContent } = useContentContext()

  const getEntryListScrollElement = () => {
    if (!entryListRef.current) {
      return null
    }

    return entryListRef.current.getScrollElement?.() || entryListRef.current.contentWrapperEl
  }

  const getSelectedCard = () => {
    return entryListRef.current?.el?.querySelector(".card-wrapper.selected") || null
  }

  const scrollSelectedCardIntoView = () => {
    if (entryListRef.current) {
      const selectedCard = getSelectedCard()
      if (selectedCard) {
        if (layoutMode === "stream") {
          const scrollElement = getEntryListScrollElement()
          if (scrollElement) {
            scrollStreamCardIntoView(selectedCard, scrollElement)

            // A second pass keeps keyboard navigation aligned when layout settles after
            // moving away from an unusually tall card.
            globalThis.setTimeout(() => {
              const latestSelectedCard = getSelectedCard()
              const latestScrollElement = getEntryListScrollElement()
              if (!latestSelectedCard || !latestScrollElement) {
                return
              }

              const containerRect = latestScrollElement.getBoundingClientRect()
              const selectedRect = latestSelectedCard.getBoundingClientRect()
              const topDelta = Math.abs(
                selectedRect.top - containerRect.top - STREAM_CARD_TOP_OFFSET,
              )

              if (topDelta > STREAM_SCROLL_ALIGNMENT_TOLERANCE) {
                scrollStreamCardIntoView(latestSelectedCard, latestScrollElement, "auto")
              }
            }, STREAM_SCROLL_RETRY_DELAY_MS)
            return
          }
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
    if (prevContent) {
      handleEntryClick(prevContent)
      setTimeout(() => scrollSelectedCardIntoView(), ANIMATION_DURATION_MS)
    } else {
      Message.info(polyglot.t("actions.no_previous_article"))
    }
  })

  // eslint-disable-next-line react-hooks/refs
  const navigateToNextArticle = withPhotoSliderCheck(() => {
    if (nextContent) {
      handleEntryClick(nextContent)
      setTimeout(() => scrollSelectedCardIntoView(), ANIMATION_DURATION_MS)
    } else {
      Message.info(polyglot.t("actions.no_next_article"))
    }
  })

  // eslint-disable-next-line react-hooks/refs
  const navigateToAdjacentUnreadArticle = withPhotoSliderCheck((direction) => {
    const adjacentUnreadEntry = findAdjacentUnreadEntry(
      activeEntryIndex,
      direction,
      filteredEntries,
    )
    if (adjacentUnreadEntry) {
      handleEntryClick(adjacentUnreadEntry)
      setTimeout(scrollSelectedCardIntoView, ANIMATION_DURATION_MS)
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

    const imageSources = extractImageSources(activeContent.content)
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
