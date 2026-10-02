import { useStore } from "@nanostores/react"

import { polyglotState } from "@/hooks/useLanguage"
import { settingsState } from "@/store/settingsState"
import { isFullTextRssActive } from "@/utils/full-text-rss"

// Names the fetcher the button will use, so it isn't confused with the
// per-feed switch, which always uses Miniflux
const useFetchOriginalTooltip = () => {
  const { polyglot } = useStore(polyglotState)
  const { contentFetcher, fullTextRssUrl } = useStore(settingsState)

  const fetcher = polyglot.t(
    isFullTextRssActive({ contentFetcher, fullTextRssUrl })
      ? "settings.content_fetcher_option_fulltextrss"
      : "settings.content_fetcher_option_miniflux",
  )
  return polyglot.t("article_card.fetch_original_tooltip", { fetcher })
}

export default useFetchOriginalTooltip
