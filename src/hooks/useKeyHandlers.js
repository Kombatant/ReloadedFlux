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

  const scrollSelectedCardIntoView = () => {
    if (entryListRef.current) {
      const selectedCard = entryListRef.current.el.querySelector(".card-wrapper.selected")
      if (selectedCard) {
        if (layoutMode === "stream") {
          const scrollElement = getEntryListScrollElement()
          if (scrollElement) {
            const containerRect = scrollElement.getBoundingClientRect()
            const selectedRect = selectedCard.getBoundingClientRect()
            const nextTop = selectedRect.top - containerRect.top + scrollElement.scrollTop - 8

            scrollElement.scrollTo({
              behavior: "smooth",
              top: Math.max(0, nextTop),
            })
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
