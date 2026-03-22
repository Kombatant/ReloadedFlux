import { computed, map } from "nanostores"

import { settingsState } from "./settingsState"

import { sortMixedLanguageArray } from "@/utils/locales"
import createSetter from "@/utils/nanostores"

const defaultValue = {
  isAppDataReady: false,
  isCoreDataReady: false,
  unreadInfo: {},
  unreadStarredCount: 0,
  unreadTodayCount: 0,
  starredCount: 0,
  historyCount: 0,
  feedsData: [],
  categoriesData: [],
  version: "",
  hasIntegrations: false,
}

export const dataState = map(defaultValue)

export const feedsState = computed([dataState, settingsState], (data, settings) => {
  const { unreadInfo, feedsData } = data
  const { language } = settings

  const feedsWithUnread = feedsData.map((feed) => ({
    ...feed,
    unreadCount: unreadInfo[feed.id] ?? 0,
  }))

  return sortMixedLanguageArray(feedsWithUnread, "title", language)
})

export const categoriesState = computed(
  [dataState, feedsState, settingsState],
  (data, feeds, settings) => {
    const { categoriesData } = data
    const { language } = settings
    const categoryStats = new Map()

    for (const feed of feeds) {
      const categoryId = feed.category.id
      const currentStats = categoryStats.get(categoryId) ?? { unreadCount: 0, feedCount: 0 }
      currentStats.unreadCount += feed.unreadCount ?? 0
      currentStats.feedCount += 1
      categoryStats.set(categoryId, currentStats)
    }

    const categoriesWithUnread = categoriesData.map((category) => {
      const stats = categoryStats.get(category.id) ?? { unreadCount: 0, feedCount: 0 }
      return {
        ...category,
        unreadCount: stats.unreadCount,
        feedCount: stats.feedCount,
      }
    })

    return sortMixedLanguageArray(categoriesWithUnread, "title", language)
  },
)

export const hiddenCategoryIdsState = computed(categoriesState, (categories) => {
  return categories.filter((category) => category.hide_globally).map((category) => category.id)
})

export const hiddenCategoryIdSetState = computed(hiddenCategoryIdsState, (hiddenCategoryIds) => {
  return new Set(hiddenCategoryIds)
})

export const hiddenFeedIdsState = computed(
  [feedsState, hiddenCategoryIdSetState],
  (feeds, hiddenCategoryIds) => {
    return feeds
      .filter((feed) => feed.hide_globally || hiddenCategoryIds.has(feed.category.id))
      .map((feed) => feed.id)
  },
)

export const hiddenFeedIdSetState = computed(hiddenFeedIdsState, (hiddenFeedIds) => {
  return new Set(hiddenFeedIds)
})

export const filteredFeedsState = computed(
  [feedsState, hiddenFeedIdSetState, settingsState],
  (feeds, hiddenFeedIds, settings) => {
    const { showHiddenFeeds } = settings
    return feeds.filter((feed) => showHiddenFeeds || !hiddenFeedIds.has(feed.id))
  },
)

export const filteredCategoriesState = computed(
  [categoriesState, hiddenCategoryIdSetState, settingsState],
  (categories, hiddenCategoryIds, settings) => {
    const { showHiddenFeeds } = settings
    return categories.filter((category) => showHiddenFeeds || !hiddenCategoryIds.has(category.id))
  },
)

export const feedsGroupedByIdState = computed(filteredFeedsState, (filteredFeeds) => {
  const groupedFeeds = {}

  for (const feed of filteredFeeds) {
    const { id } = feed.category

    if (!groupedFeeds[id]) {
      groupedFeeds[id] = []
    }

    groupedFeeds[id].push(feed)
  }

  return groupedFeeds
})

export const unreadTotalState = computed([dataState, filteredFeedsState], (data, filteredFeeds) => {
  const { unreadInfo } = data
  const filteredFeedIds = new Set(filteredFeeds.map((feed) => feed.id))
  let total = 0

  for (const [id, count] of Object.entries(unreadInfo)) {
    if (filteredFeedIds.has(Number(id))) {
      total += count
    }
  }

  return total
})

export const setCategoriesData = createSetter(dataState, "categoriesData")
export const setFeedsData = createSetter(dataState, "feedsData")
export const setHasIntegrations = createSetter(dataState, "hasIntegrations")
export const setHistoryCount = createSetter(dataState, "historyCount")
export const setIsAppDataReady = createSetter(dataState, "isAppDataReady")
export const setIsCoreDataReady = (isCoreDataReady) => {
  dataState.setKey("isCoreDataReady", isCoreDataReady)
}
export const setStarredCount = createSetter(dataState, "starredCount")
export const setUnreadInfo = createSetter(dataState, "unreadInfo")
export const setUnreadStarredCount = createSetter(dataState, "unreadStarredCount")
export const setUnreadTodayCount = createSetter(dataState, "unreadTodayCount")
export const setVersion = createSetter(dataState, "version")
export const resetData = () => dataState.set(defaultValue)
