import { useStore } from "@nanostores/react"
import { useCallback, useState } from "react"

import { polyglotState } from "@/hooks/useLanguage"
import { buildEmbedUrl, buildHandle } from "@/utils/social-embeds"

import MetaPostCard from "./MetaPostCard"
import TweetEmbed from "./TweetEmbed"

import "./SocialEmbed.css"

const META_CARD_PLATFORMS = new Set(["facebook", "instagram", "threads"])

const resolveTheme = () => (document.body.getAttribute("arco-theme") === "dark" ? "dark" : "light")

const SocialEmbed = ({ embed, fallbackText }) => {
  const { polyglot } = useStore(polyglotState)
  const { permalink, platform } = embed

  // Native tweets are a plain JSON fetch with no third-party framing or
  // cookies, so they render immediately rather than behind a click gate.
  const [isLoaded, setIsLoaded] = useState(platform.mode === "tweet")
  const [hasFailed, setHasFailed] = useState(false)

  // Stable so TweetEmbed's fetch effect does not re-run on every render.
  const handleUnavailable = useCallback(() => setHasFailed(true), [])

  const handle = buildHandle(embed)
  // "tweet" fetches JSON and renders natively; "iframe" frames the platform's
  // embed view; "card" (and anything that has failed) shows a link card.
  const isNativeTweet = platform.mode === "tweet" && !hasFailed
  const canFrame = platform.mode === "iframe" && !hasFailed
  const canLoad = isNativeTweet || canFrame

  const label = canLoad
    ? polyglot.t(platform.labelKey)
    : polyglot.t("content.social_embed_open_generic", {
        platform: polyglot.t(`content.social_embed_platform_${platform.id}`),
      })

  // A failed load must revert to the placeholder, so gate on both.
  const showPlaceholder = !isLoaded || hasFailed

  if (showPlaceholder) {
    const placeholderContent = (
      <>
        <span aria-hidden="true" className={`social-embed-icon social-embed-icon-${platform.id}`} />
        <span className="social-embed-label">
          <span className="social-embed-label-action">{label}</span>
          {handle ? <span className="social-embed-label-handle">@{handle}</span> : null}
        </span>
      </>
    )

    // Meta's platforms block framing and expose no content API, so they get a
    // rich card shaped like the tweet card rather than the generic chip.
    if (!canLoad && META_CARD_PLATFORMS.has(platform.id)) {
      return <MetaPostCard embed={embed} fallbackText={fallbackText} />
    }

    // Reached when an iframe platform fails to load. An anchor rather than a
    // button so middle-click, copy-link and keyboard activation behave the way
    // the rest of the article does.
    if (!canLoad) {
      return (
        <a
          className="social-embed-placeholder"
          href={permalink}
          rel="noopener noreferrer"
          target="_blank"
          onClick={(event) => event.stopPropagation()}
        >
          {placeholderContent}
        </a>
      )
    }

    return (
      <button
        className="social-embed-placeholder"
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          setIsLoaded(true)
        }}
      >
        {placeholderContent}
      </button>
    )
  }

  if (isNativeTweet) {
    return <TweetEmbed embed={embed} onUnavailable={handleUnavailable} />
  }

  return (
    <div className="social-embed" style={{ aspectRatio: platform.aspectRatio }}>
      <iframe
        allowFullScreen
        allow="clipboard-write; encrypted-media; picture-in-picture; web-share"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        scrolling="no"
        src={buildEmbedUrl(embed, { theme: resolveTheme() })}
        style={{ maxWidth: platform.maxWidth }}
        title={permalink}
        onError={() => setHasFailed(true)}
      />
    </div>
  )
}

export default SocialEmbed
