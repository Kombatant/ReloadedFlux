import { persistentAtom } from "@nanostores/persistent"

import { getBrowserLanguage } from "@/utils/locales"

const defaultValue = {
  aiApiKey: "",
  aiApiKeys: {
    anthropic: "",
    gemini: "",
    perplexity: "",
    ollama: "",
    lmstudio: "",
  },
  aiModels: {
    anthropic: "",
    gemini: "",
    perplexity: "",
    ollama: "",
    lmstudio: "",
  },
  aiModel: "",
  aiProvider: "none",
  articleWidth: 75,
  sidebarWidth: 240,
  entryListWidth: 420,
  compactSidebarGroups: true,
  coverDisplayMode: "auto",
  edgeToEdgeImages: false,
  enableContextMenu: true,
  enableSwipeGesture: true,
  fontFamily: "system-ui",
  fontSize: 1.05,
  homePage: "all",
  language: getBrowserLanguage(),
  lightboxSlideAnimation: true,
  layoutMode: "classic",
  markReadBy: "view",
  markReadOnScroll: false,
  orderBy: "created_at",
  orderDirection: "desc",
  pageSize: 100,
  removeDuplicates: "none",
  showDetailedRelativeTime: false,
  showEstimatedReadingTime: false,
  showFeedIcon: true,
  showHiddenFeeds: false,
  showStatus: "unread",
  showUnreadFeedsOnly: false,
  swipeSensitivity: 1,
  themeColor: "Blue",
  themeMode: "system",
  titleAlignment: "center",
  updateContentOnFetch: false,
}

export const settingsState = persistentAtom("settings", defaultValue, {
  encode: (value) => {
    const filteredValue = {}

    for (const key in value) {
      if (key in defaultValue) {
        filteredValue[key] = value[key]
      }
    }

    return JSON.stringify(filteredValue)
  },
  decode: (str) => {
    const storedValue = JSON.parse(str)

    // Backward compatibility: older versions stored `articleWidth` as `ch` (50–100).
    // The setting is now a percentage of the article pane (50–90, step 5).
    if (typeof storedValue.articleWidth === "number") {
      const raw = storedValue.articleWidth
      const migrated = raw > 90 ? raw * 0.9 : raw
      const clamped = Math.min(90, Math.max(50, migrated))
      storedValue.articleWidth = Math.round(clamped / 5) * 5
    }

    if (typeof storedValue.sidebarWidth === "number") {
      storedValue.sidebarWidth = Math.min(480, Math.max(180, storedValue.sidebarWidth))
    }

    if (typeof storedValue.entryListWidth === "number") {
      storedValue.entryListWidth = Math.min(900, Math.max(280, storedValue.entryListWidth))
    }

    if (storedValue.layoutMode && !["classic", "stream"].includes(storedValue.layoutMode)) {
      storedValue.layoutMode = "classic"
    }

    if (
      storedValue.aiProvider &&
      !["none", "anthropic", "gemini", "perplexity", "ollama", "lmstudio"].includes(
        storedValue.aiProvider,
      )
    ) {
      storedValue.aiProvider = "none"
      storedValue.aiModel = ""
    }

    if (!storedValue.aiApiKeys || typeof storedValue.aiApiKeys !== "object") {
      storedValue.aiApiKeys = {}
    }

    if (
      storedValue.aiApiKey &&
      storedValue.aiProvider &&
      storedValue.aiProvider !== "none" &&
      !storedValue.aiApiKeys[storedValue.aiProvider]
    ) {
      storedValue.aiApiKeys[storedValue.aiProvider] = storedValue.aiApiKey
    }

    if (!storedValue.aiModels || typeof storedValue.aiModels !== "object") {
      storedValue.aiModels = {}
    }

    if (
      storedValue.aiModel &&
      storedValue.aiProvider &&
      storedValue.aiProvider !== "none" &&
      !storedValue.aiModels[storedValue.aiProvider]
    ) {
      storedValue.aiModels[storedValue.aiProvider] = storedValue.aiModel
    }

    return { ...defaultValue, ...storedValue }
  },
})

export const getSettings = (key) => settingsState.get()[key]

export const updateSettings = (settingsChanges) =>
  settingsState.set({ ...settingsState.get(), ...settingsChanges })

export const resetSettings = () => settingsState.set(defaultValue)
