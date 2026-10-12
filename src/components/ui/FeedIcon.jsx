import { useRef, useState } from "react"

import useFeedIcons from "@/hooks/useFeedIcons"
import { updateFeedIcon } from "@/store/feedIconsState"
import { getSecondHostname } from "@/utils/url"

import "./controls.css"

const DEFAULT_ICON_URL = "/default-feed-icon.png"

const getFallbackIconURL = (feed) => {
  const hostname = getSecondHostname(feed.site_url) ?? getSecondHostname(feed.feed_url)
  return `https://icons.duckduckgo.com/ip3/${hostname}.ico`
}

const FeedIcon = ({ feed, className = "feed-icon" }) => {
  const { icon_id: iconId } = feed.icon
  const fallbackIconURL = getFallbackIconURL(feed)

  const [useFallback, setUseFallback] = useState(false)
  const [fallbackFailed, setFallbackFailed] = useState(false)

  const imgRef = useRef(null)

  const fetchedIcon = useFeedIcons(iconId, feed)
  const fetchedIconURL = fetchedIcon?.url

  const iconURL = (() => {
    if (fallbackFailed) {
      return DEFAULT_ICON_URL
    }
    if (fetchedIconURL && !useFallback) {
      return fetchedIconURL
    }
    if (iconId === 0 || useFallback) {
      return fallbackIconURL
    }
    return DEFAULT_ICON_URL
  })()

  const handleImageLoad = () => {
    if (imgRef.current) {
      const { naturalWidth, naturalHeight } = imgRef.current
      if (naturalWidth > 200 && naturalHeight > 200 && fetchedIcon.width === null) {
        updateFeedIcon(iconId, { width: naturalWidth, height: naturalHeight })
      }
      if ((naturalWidth !== naturalHeight || naturalWidth === 0) && !useFallback) {
        setUseFallback(true)
      }
    }
  }

  const handleError = () => {
    if (iconURL === fallbackIconURL && !fallbackFailed) {
      setFallbackFailed(true)
      return
    }

    if (!fallbackFailed && !useFallback) {
      setUseFallback(true)
    }
  }

  if (fallbackFailed) {
    return (
      <img
        alt=""
        className={className ? `app-feed-icon ${className}` : "app-feed-icon"}
        src={DEFAULT_ICON_URL}
      />
    )
  }

  return (
    <img
      ref={imgRef}
      alt=""
      className={className ? `app-feed-icon ${className}` : "app-feed-icon"}
      src={iconURL}
      onError={handleError}
      onLoad={handleImageLoad}
    />
  )
}

export default FeedIcon
