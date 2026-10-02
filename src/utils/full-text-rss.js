/**
 * Article extraction via a user-hosted FiveFilters Full-Text RSS server.
 *
 * Requests go straight from the browser to the server's extract.php JSON
 * endpoint, so the server must send CORS headers ($options->cors = true in its
 * config). Callers sanitize the HTML before display even when it is saved back
 * to the entry: Miniflux only sanitizes entry updates since 2.2.16 (Dec 2025).
 */
import DOMPurify from "dompurify"

const REQUEST_TIMEOUT_MS = 30_000

// Miniflux's default reading speed, so estimates match server-computed times
const WORDS_PER_MINUTE = 265

// What Full-Text RSS emits when extraction fails, with its default config.
// extract.php returns empty content instead, but the feed endpoint and some
// older or customised servers send this with a 200 response.
const EXTRACTION_FAILED_TEXT = "[unable to retrieve full-text content]"

const MEDIA_TAG_PATTERN = /<(img|picture|video|audio|iframe|svg)\b/i

// DOMPurify's defaults keep these but Miniflux's sanitizer drops them. Article
// HTML is rendered inline, so a <style> block would restyle the whole app.
const SANITIZE_OPTIONS = {
  FORBID_TAGS: ["style", "form", "input", "button", "select", "option", "textarea"],
  FORBID_ATTR: ["style"],
}

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

// Full-Text RSS is only used when it is selected and has a server to call;
// otherwise fetches go through Miniflux
export const isFullTextRssActive = ({ contentFetcher, fullTextRssUrl }) =>
  contentFetcher === "fulltextrss" && Boolean(fullTextRssUrl)

export const estimateReadingTime = (wordCount) => {
  if (typeof wordCount !== "number" || !Number.isFinite(wordCount) || wordCount <= 0) {
    return null
  }
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE))
}

// True when the HTML holds something to read: text or media, and not the
// Full-Text RSS failure message
export const hasExtractedContent = (html) => {
  if (typeof html !== "string" || html.includes(EXTRACTION_FAILED_TEXT)) {
    return false
  }
  const text = html.replaceAll(/<[^>]*>/g, "").replaceAll(/&nbsp;|\s/g, "")
  return text !== "" || MEDIA_TAG_PATTERN.test(html)
}

// In-page anchors (footnotes) stay relative, and anything that doesn't
// resolve to http(s) is left alone
export const resolveArticleUrl = (value, baseUrl) => {
  if (!value || value.startsWith("#")) {
    return value
  }
  try {
    const url = new URL(value, baseUrl)
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : value
  } catch {
    return value
  }
}

export const resolveArticleSrcset = (srcset, baseUrl) => {
  // data: URLs contain commas, which would break the candidate split
  if (!srcset || srcset.includes("data:")) {
    return srcset
  }
  return srcset
    .split(",")
    .map((candidate) => candidate.trim())
    .filter(Boolean)
    .map((candidate) => {
      const [url, ...descriptors] = candidate.split(/\s+/)
      return [resolveArticleUrl(url, baseUrl), ...descriptors].join(" ")
    })
    .join(", ")
}

const URL_ATTRIBUTES = ["href", "src", "poster"]

/**
 * With a baseUrl, relative links and media are resolved against it, as
 * Miniflux's sanitizer does; content Miniflux already sanitized is passed
 * without one so its own (possibly media-proxy) URLs are kept as they are.
 */
export const sanitizeArticleHtml = (html, baseUrl) => {
  if (!baseUrl) {
    return DOMPurify.sanitize(html, SANITIZE_OPTIONS)
  }

  const body = DOMPurify.sanitize(html, { ...SANITIZE_OPTIONS, RETURN_DOM: true })
  for (const element of body.querySelectorAll("[href], [src], [poster], [srcset]")) {
    for (const name of URL_ATTRIBUTES) {
      if (element.hasAttribute(name)) {
        element.setAttribute(name, resolveArticleUrl(element.getAttribute(name), baseUrl))
      }
    }
    if (element.hasAttribute("srcset")) {
      element.setAttribute("srcset", resolveArticleSrcset(element.getAttribute("srcset"), baseUrl))
    }
  }
  return body.innerHTML
}

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
    if (!hasExtractedContent(content)) {
      throw new Error("Full-Text RSS returned no content")
    }

    return {
      content,
      wordCount: data.word_count ?? null,
      // Relative URLs resolve against the page after redirects
      baseUrl: data.effective_url || articleUrl,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}
