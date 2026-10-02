import Confetti from "canvas-confetti"

import {
  getOriginalContent,
  saveEntryContent,
  saveToThirdPartyServices,
  toggleEntryStarred,
  updateEntriesStatus,
} from "@/apis"
import { polyglotState } from "@/hooks/useLanguage"
import {
  contentState,
  fetchingContentIdsState,
  setActiveContent,
  setContentFetching,
  setEntries,
} from "@/store/contentState"
import {
  setHistoryCount,
  setStarredCount,
  setUnreadInfo,
  setUnreadTodayCount,
} from "@/store/dataState"
import { getSettings } from "@/store/settingsState"
import {
  AI_PROVIDERS,
  AI_SUMMARY_LANGUAGE_AUTO,
  formatSummaryHtml,
  summarizeWithProvider,
} from "@/utils/ai"
import { checkIsInLast24Hours } from "@/utils/date"
import { extractTextFromHtml } from "@/utils/dom"
import { Message, Notification } from "@/utils/feedback"
import {
  buildFullTextRssExtractUrl,
  estimateReadingTime,
  fetchFullTextContent,
  hasExtractedContent,
  isFullTextRssActive,
  sanitizeArticleHtml,
} from "@/utils/full-text-rss"
import { parseCoverImage } from "@/utils/images"

const updateEntries = (entries, updatedEntries) => {
  const updatedEntryIds = new Set(updatedEntries.map((entry) => entry.id))
  return entries.map((entry) => {
    if (updatedEntryIds.has(entry.id)) {
      const updatedEntry = updatedEntries.find((e) => e.id === entry.id)
      return updatedEntry || entry
    }
    return entry
  })
}

export const handleEntriesStatusUpdate = (entries, newStatus) => {
  const feedCountChanges = {}
  let unreadTodayCountChange = 0
  const filteredEntries = entries.filter((entry) => entry.status !== newStatus)
  if (filteredEntries.length === 0) {
    return
  }

  if (newStatus === "read") {
    setHistoryCount((prev) => prev + filteredEntries.length)
  } else {
    setHistoryCount((prev) => Math.max(0, prev - filteredEntries.length))
  }

  for (const entry of filteredEntries) {
    const feedId = entry.feed.id
    const isRecent = checkIsInLast24Hours(entry.published_at)
    const statusDelta = newStatus === "read" ? -1 : 1

    feedCountChanges[feedId] = (feedCountChanges[feedId] ?? 0) + statusDelta
    unreadTodayCountChange += isRecent ? statusDelta : 0
  }

  setUnreadTodayCount((prev) => Math.max(0, prev + unreadTodayCountChange))

  setUnreadInfo((prev) => {
    const updatedInfo = { ...prev }
    for (const [feedId, change] of Object.entries(feedCountChanges)) {
      updatedInfo[feedId] = Math.max(0, (updatedInfo[feedId] ?? 0) + change)
    }
    return updatedInfo
  })

  const updatedEntries = filteredEntries.map((entry) => ({
    ...entry,
    status: newStatus,
  }))

  const { activeContent } = contentState.get()
  const activeEntry = updatedEntries.find((entry) => entry.id === activeContent?.id)
  if (activeEntry) {
    setActiveContent(activeEntry)
  }

  setEntries((prev) => updateEntries(prev, updatedEntries))
}

// Marks entries dropped by deduplication as read, optimistically. Lives here
// rather than in utils/deduplicate so that module stays free of api/hook
// imports; those edges previously formed import cycles.
export const markDuplicatesAsRead = (duplicateEntries) => {
  const unreadDuplicateIds = duplicateEntries
    .filter((entry) => entry.status === "unread")
    .map((entry) => entry.id)

  if (unreadDuplicateIds.length === 0) {
    return
  }

  const { polyglot } = polyglotState.get()

  handleEntriesStatusUpdate(duplicateEntries, "read")
  updateEntriesStatus(unreadDuplicateIds, "read").catch(() => {
    Message.error(polyglot.t("deduplicate.mark_as_read_error"))
    handleEntriesStatusUpdate(duplicateEntries, "unread")
  })
}

const handleEntryStatusUpdate = (entry, newStatus) => {
  handleEntriesStatusUpdate([entry], newStatus)
}

const handleOpenLinkExternally = (entry) => {
  window.open(entry.url, "_blank")
}

const handleEntryStarredUpdate = (entry, newStarred) => {
  const { activeContent } = contentState.get()
  if (newStarred) {
    setStarredCount((prev) => prev + 1)
    Confetti({
      particleCount: 100,
      angle: 120,
      spread: 70,
      origin: { x: 1, y: 1 },
    })
  } else {
    setStarredCount((prev) => Math.max(0, prev - 1))
  }

  const updatedEntry = { ...entry, starred: newStarred }
  if (activeContent?.id === entry.id) {
    setActiveContent(updatedEntry)
  }
  setEntries((prev) => updateEntries(prev, [updatedEntry]))
}

const handleToggleStatus = async (entry) => {
  const prevStatus = entry.status
  const newStatus = prevStatus === "read" ? "unread" : "read"
  handleEntryStatusUpdate(entry, newStatus)

  updateEntriesStatus([entry.id], newStatus).catch(() => {
    const { polyglot } = polyglotState.get()
    Message.error(
      newStatus === "read"
        ? polyglot.t("actions.mark_as_read_error")
        : polyglot.t("actions.mark_as_unread_error"),
    )
    handleEntryStatusUpdate(entry, prevStatus)
  })
}

const handleToggleStarred = async (entry) => {
  const newStarred = !entry.starred
  handleEntryStarredUpdate(entry, newStarred)

  toggleEntryStarred(entry.id).catch(() => {
    const { polyglot } = polyglotState.get()
    Message.error(
      newStarred ? polyglot.t("actions.star_error") : polyglot.t("actions.unstar_error"),
    )
    handleEntryStarredUpdate(entry, !newStarred)
  })
}

// Fetches and summaries can take a while, so merge onto the entry as it is
// now rather than the snapshot taken when the request started; otherwise a
// star or status change made in the meantime would be reverted.
const getLatestEntry = (entry) => {
  const { activeContent, entries } = contentState.get()
  if (activeContent?.id === entry.id) {
    return activeContent
  }
  return entries.find((e) => e.id === entry.id) ?? entry
}

const updateEntryContent = (entry, updates) => {
  const updatedEntry = parseCoverImage({ ...getLatestEntry(entry), ...updates })
  const { activeContent } = contentState.get()

  if (activeContent?.id === entry.id) {
    setActiveContent(updatedEntry)
  }

  setEntries((prev) => updateEntries(prev, [updatedEntry]))
  return updatedEntry
}

// Resolves the entry's new content and reading time from Full-Text RSS. With
// auto-save on, the content is saved through Miniflux, which recomputes the
// reading time; otherwise (or if that save fails) it only replaces the
// in-memory entry. It is sanitized before saving and again before display,
// since Miniflux before 2.2.16 stores entry updates unsanitized. saveFailed
// tells the caller the user asked for a save that did not happen.
const fetchContentFromFullTextRss = async (entry) => {
  const serverUrl = getSettings("fullTextRssUrl")
  console.info(
    "[fetch-content] Using Full-Text RSS:",
    buildFullTextRssExtractUrl(serverUrl, entry.url),
  )
  const {
    content: rawContent,
    wordCount,
    baseUrl,
  } = await fetchFullTextContent(serverUrl, entry.url)
  const content = sanitizeArticleHtml(rawContent, baseUrl)
  if (!hasExtractedContent(content)) {
    throw new Error("Full-Text RSS content was empty after sanitizing")
  }
  const localUpdates = {
    content,
    reading_time: estimateReadingTime(wordCount) ?? entry.reading_time,
  }

  if (getSettings("updateContentOnFetch")) {
    try {
      const savedEntry = await saveEntryContent(entry.id, content)
      console.info(`[fetch-content] Full-Text RSS content saved to Miniflux entry ${entry.id}`)
      return {
        updates: {
          content: sanitizeArticleHtml(savedEntry.content),
          reading_time: savedEntry.reading_time ?? entry.reading_time,
        },
        saveFailed: false,
      }
    } catch (error) {
      console.error("Failed to save Full-Text RSS content:", error)
      console.info("[fetch-content] Full-Text RSS content applied locally (save failed)")
      return { updates: localUpdates, saveFailed: true }
    }
  }

  console.info("[fetch-content] Full-Text RSS content applied locally (not saved)")
  return { updates: localUpdates, saveFailed: false }
}

const fetchEntryContent = async (entry) => {
  if (
    isFullTextRssActive({
      contentFetcher: getSettings("contentFetcher"),
      fullTextRssUrl: getSettings("fullTextRssUrl"),
    })
  ) {
    try {
      const { updates, saveFailed } = await fetchContentFromFullTextRss(entry)
      const { polyglot } = polyglotState.get()
      if (saveFailed) {
        Message.warning(polyglot.t("actions.full_text_rss_save_error"))
      } else {
        Message.success(polyglot.t("actions.fetched_content_success"))
      }
      return updateEntryContent(entry, updates)
    } catch (error) {
      console.error("Failed to fetch content from Full-Text RSS:", error)
      const { polyglot } = polyglotState.get()
      Message.warning(polyglot.t("actions.full_text_rss_fallback"))
    }
  }

  try {
    console.info(`[fetch-content] Using Miniflux built-in fetcher for entry ${entry.id}`)
    const response = await getOriginalContent(entry.id)
    const { polyglot } = polyglotState.get()
    Message.success(polyglot.t("actions.fetched_content_success"))
    const newContent = response.content
    const newReadingTime = response.reading_time ?? entry.reading_time
    return updateEntryContent(entry, { content: newContent, reading_time: newReadingTime })
  } catch (error) {
    console.error("Failed to fetch content:", error)
    const { polyglot } = polyglotState.get()
    Message.error(polyglot.t("actions.fetched_content_error"))
    return null
  }
}

// Resolves to the updated entry, or null when the fetch failed or one for the
// same entry is already running (hotkeys and buttons can fire repeatedly).
const handleFetchContent = async (entry = contentState.get().activeContent) => {
  if (!entry || fetchingContentIdsState.get().has(entry.id)) {
    return null
  }

  setContentFetching(entry.id, true)
  try {
    return await fetchEntryContent(entry)
  } finally {
    setContentFetching(entry.id, false)
  }
}

const handleSummarizeContent = async (entry = contentState.get().activeContent) => {
  const aiProvider = getSettings("aiProvider")
  const aiApiKeys = getSettings("aiApiKeys") || {}
  const aiApiKey = aiApiKeys?.[aiProvider] || ""
  const aiModels = getSettings("aiModels") || {}
  const aiModel = aiModels?.[aiProvider] || ""
  const aiSummaryLanguage = getSettings("aiSummaryLanguage") || AI_SUMMARY_LANGUAGE_AUTO
  const aiSummaryExcludedLanguage = getSettings("aiSummaryExcludedLanguage") || ""
  const { polyglot } = polyglotState.get()

  if (!entry) {
    return null
  }

  if (aiProvider === AI_PROVIDERS.NONE) {
    Message.warning(polyglot.t("actions.ai_summary_provider_missing"))
    return null
  }

  if (!aiApiKey) {
    Message.warning(polyglot.t("actions.ai_summary_api_key_missing"))
    return null
  }

  if (!aiModel) {
    Message.warning(polyglot.t("actions.ai_summary_model_missing"))
    return null
  }

  const textContent = extractTextFromHtml(entry.content)
  if (!textContent) {
    Message.error(polyglot.t("actions.ai_summary_error"))
    return null
  }

  const trimmedContent = textContent.slice(0, 12_000)

  try {
    const startTime = performance.now()
    const summary = await summarizeWithProvider({
      provider: aiProvider,
      apiKey: aiApiKey,
      model: aiModel,
      title: entry.title,
      content: trimmedContent,
      targetLanguage: aiSummaryLanguage,
      excludedLanguage: aiSummaryExcludedLanguage,
    })
    const elapsedSeconds = ((performance.now() - startTime) / 1000).toFixed(1)

    const summaryHtml = formatSummaryHtml(
      summary,
      polyglot.t("article_card.ai_summary_heading", { model: aiModel }),
    )

    if (!summaryHtml) {
      Message.error(polyglot.t("actions.ai_summary_error"))
      return null
    }

    updateEntryContent(entry, { content: summaryHtml })
    Message.success(
      polyglot.t("actions.ai_summary_success", {
        model: aiModel,
        seconds: elapsedSeconds,
      }),
    )
    return summaryHtml
  } catch (error) {
    console.error("Failed to summarize content:", error)
    Message.error(polyglot.t("actions.ai_summary_error"))
    return null
  }
}

const handleSaveToThirdPartyServices = async (entry) => {
  const { polyglot } = polyglotState.get()
  try {
    const response = await saveToThirdPartyServices(entry.id)
    if (response.status === 202) {
      Notification.success({
        title: polyglot.t("actions.saved_to_third-party_services_success"),
      })
    } else {
      Notification.error({
        title: polyglot.t("actions.saved_to_third-party_services_error"),
      })
    }
  } catch (error) {
    console.error("Failed to save to third-party services:", error)
    Notification.error({
      title: polyglot.t("actions.saved_to_third-party_services_error"),
      content: error.message,
    })
  }
}

const useEntryActions = () => ({
  handleEntryStatusUpdate,
  handleFetchContent,
  handleOpenLinkExternally,
  handleSaveToThirdPartyServices,
  handleSummarizeContent,
  handleToggleStarred,
  handleToggleStatus,
})

export default useEntryActions
