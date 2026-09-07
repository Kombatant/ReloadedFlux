/* eslint-disable import/extensions */
import { SUPPORTED_LANGUAGES } from "./settings-transfer/settings-config.js"

export const DEFAULT_LANGUAGE = "en-CA"

// Resolve any browser language tag to a locale we actually ship, so an
// unsupported region (en-GB, de-AT, ...) falls back to its language match
// instead of being stored verbatim and failing to load.
export const resolveLanguage = (browserLanguage) => {
  if (!browserLanguage || typeof browserLanguage !== "string") {
    return DEFAULT_LANGUAGE
  }

  const normalized = browserLanguage.replaceAll("_", "-")
  const exactMatch = SUPPORTED_LANGUAGES.find(
    (supported) => supported.toLowerCase() === normalized.toLowerCase(),
  )
  if (exactMatch) {
    return exactMatch
  }

  const [subtag] = normalized.toLowerCase().split("-")
  if (subtag === "zh") {
    return "zh-CN"
  }

  const subtagMatch = SUPPORTED_LANGUAGES.find(
    (supported) => supported.slice(0, 2).toLowerCase() === subtag,
  )
  return subtagMatch ?? DEFAULT_LANGUAGE
}

export const getBrowserLanguage = () => resolveLanguage(navigator.language)

// Determine priority type for sorting text
const getTextType = (text) => {
  if (/^[0-9]/.test(text)) {
    return 0
  }
  if (/^[a-zA-Z]/.test(text)) {
    return 1
  }
  return 2
}

// Sorts array with mixed language content using a multi-level comparison
export const sortMixedLanguageArray = (array, keyOrGetter, locale) => {
  // Create value extractor based on parameter type
  const getValueFromItem =
    typeof keyOrGetter === "function" ? keyOrGetter : (item) => item[keyOrGetter]

  return [...array].toSorted((itemA, itemB) => {
    const valueA = getValueFromItem(itemA)
    const valueB = getValueFromItem(itemB)

    const typeA = getTextType(valueA)
    const typeB = getTextType(valueB)

    // First sort by type priority
    if (typeA !== typeB) {
      return typeA - typeB
    }

    // Then sort by locale rules within the same type
    return valueA.localeCompare(valueB, locale, { numeric: true })
  })
}
