/**
 * Article extraction via a user-hosted FiveFilters Full-Text RSS server.
 *
 * Requests go straight from the browser to the server's extract.php JSON
 * endpoint, so the server must send CORS headers ($options->cors = true in its
 * config). The server's HTML is not run through Miniflux's sanitizer unless it
 * is saved back to the entry, so callers sanitize it before display.
 */
import DOMPurify from "dompurify"

const REQUEST_TIMEOUT_MS = 30_000

// Miniflux's default reading speed, so estimates match server-computed times
const WORDS_PER_MINUTE = 265

/**
 * Accepts either the server root ("https://ftr.example.com") or a full
 * endpoint ("https://ftr.example.com/extract.php"). Returns null when the
 * server URL is not a usable http(s) URL.
 */
export const buildFullTextRssExtractUrl = (serverUrl, articleUrl) => {
  const base = (serverUrl || "").trim().replace(/\/+$/, "")
  if (!base || !articleUrl) {
    return null
  }

  let url
  try {
    url = new URL(base)
  } catch {
    return null
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null
  }

  if (!url.pathname.endsWith(".php")) {
    url.pathname = `${url.pathname.replace(/\/+$/, "")}/extract.php`
  }

  url.searchParams.set("url", articleUrl)
  return url.toString()
}

export const estimateReadingTime = (wordCount) => {
  if (typeof wordCount !== "number" || !Number.isFinite(wordCount) || wordCount <= 0) {
    return null
  }
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE))
}

export const sanitizeArticleHtml = (html) => DOMPurify.sanitize(html)

export const fetchFullTextContent = async (serverUrl, articleUrl) => {
  const extractUrl = buildFullTextRssExtractUrl(serverUrl, articleUrl)
  if (!extractUrl) {
    throw new Error("Invalid Full-Text RSS server URL")
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(extractUrl, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`Full-Text RSS responded with ${response.status}`)
    }

    const data = await response.json()
    const content = typeof data?.content === "string" ? data.content.trim() : ""
    if (!content) {
      throw new Error("Full-Text RSS returned no content")
    }

    return { content, wordCount: data.word_count ?? null }
  } finally {
    clearTimeout(timeoutId)
  }
}
