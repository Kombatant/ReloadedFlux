import { useStore } from "@nanostores/react"
import classNames from "classnames"
import { useMemo, useState } from "react"

import ArticleCard from "@/components/Article/ArticleCard"
import ArticleReadingView from "@/components/Article/ArticleReadingView"
import StreamArticleCard from "@/components/Article/StreamArticleCard"
import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import { dataState } from "@/store/dataState"
import { settingsState } from "@/store/settingsState"
import { parseCoverImage } from "@/utils/images"

import "./AppearancePreview.css"

// A wide landscape so the card picks its banner/thumbnail like a real cover,
// and the body treats it as a big image (edge-to-edge applies on phones).
const SAMPLE_IMAGE = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">' +
    '<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#8fb3e8"/><stop offset="1" stop-color="#e9d3c2"/>' +
    "</linearGradient></defs>" +
    '<rect width="1200" height="630" fill="url(#s)"/>' +
    '<circle cx="880" cy="210" r="70" fill="#fff4d6"/>' +
    '<path d="M0 470 L260 300 L470 430 L700 260 L1200 520 L1200 630 L0 630 Z" fill="#5b7fa8"/>' +
    '<path d="M0 540 L330 420 L620 520 L900 400 L1200 560 L1200 630 L0 630 Z" fill="#3e5f86"/>' +
    "</svg>",
)}`

const FALLBACK_FEED = {
  id: 0,
  title: "ReloadedFlux",
  site_url: "",
  feed_url: "",
  icon: { feed_id: 0, icon_id: 0 },
  category: { id: 0, title: "" },
}

const noop = () => {}

// "2 hours 14 minutes ago": long enough for detailed relative time to differ.
const SAMPLE_AGE_MS = (2 * 60 + 14) * 60 * 1000

/** A fixed sample article, attributed to one of the user's own feeds. */
const useSampleEntry = () => {
  const { feedsData } = useStore(dataState)
  const { polyglot } = useStore(polyglotState)
  const feed = feedsData.find((item) => item.icon?.icon_id) ?? feedsData[0] ?? FALLBACK_FEED
  // Fixed per mount so the relative time doesn't tick while settings change.
  const [publishedAt] = useState(() => new Date(Date.now() - SAMPLE_AGE_MS).toISOString())

  return useMemo(
    () =>
      parseCoverImage({
        id: "settings-preview",
        author: polyglot.t("settings.preview.sample_author"),
        content: `<p>${polyglot.t("settings.preview.sample_paragraph_1")}</p><p><img src="${SAMPLE_IMAGE}" width="1200" height="630" alt=""></p><p>${polyglot.t("settings.preview.sample_paragraph_2")}</p>`,
        enclosures: [],
        feed,
        published_at: publishedAt,
        reading_time: 4,
        starred: false,
        status: "unread",
        title: polyglot.t("settings.preview.sample_title"),
        url: "#",
      }),
    [feed, polyglot, publishedAt],
  )
}

/** Column is the only layout on phones, whatever is stored. */
const useActiveLayout = () => {
  const { layoutMode } = useStore(settingsState)
  const { isBelowMedium } = useScreenWidth()
  return isBelowMedium ? "classic" : layoutMode
}

// `inert` keeps the real components on display only: no clicks, focus or menus.
const PreviewFrame = ({ children, className }) => {
  const { polyglot } = useStore(polyglotState)

  return (
    <div className={classNames("settings-preview", className)}>
      <div className="settings-preview-label">{polyglot.t("settings.preview.label")}</div>
      <div inert className="settings-preview-frame">
        {children}
      </div>
    </div>
  )
}

const StreamCardPreview = ({ entry }) => (
  <StreamArticleCard
    preview
    entry={entry}
    handleEntryClick={noop}
    infoFrom="all"
    isSelected={false}
    shouldPreload={false}
  />
)

/** The reading view: the Column reading pane, or a Combined card. */
export const ArticleTextPreview = () => {
  const { titleAlignment } = useStore(settingsState)
  const entry = useSampleEntry()
  const layout = useActiveLayout()

  return (
    <PreviewFrame className="settings-preview-text">
      {layout === "stream" ? (
        <StreamCardPreview entry={entry} />
      ) : (
        <div
          className={classNames("article-content", {
            "article-text-justify": titleAlignment === "justify",
          })}
        >
          <ArticleReadingView entry={entry} />
        </div>
      )}
    </PreviewFrame>
  )
}

/** A list card in Column; a Combined card's frame without its body. */
export const ArticleCardPreview = () => {
  const { entryListWidth } = useStore(settingsState)
  const entry = useSampleEntry()
  const layout = useActiveLayout()
  const bodilessEntry = useMemo(() => ({ ...entry, content: "", previewText: "" }), [entry])

  return (
    <PreviewFrame className="settings-preview-cards">
      {layout === "stream" ? (
        <StreamCardPreview entry={bodilessEntry} />
      ) : (
        <div className="settings-preview-list" style={{ maxWidth: entryListWidth }}>
          <ArticleCard preview entry={entry} handleEntryClick={noop} />
        </div>
      )}
    </PreviewFrame>
  )
}
