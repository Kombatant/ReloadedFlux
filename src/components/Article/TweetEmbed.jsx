import { useStore } from "@nanostores/react"
import { useEffect, useState } from "react"

import PlyrPlayer from "@/components/ui/PlyrPlayer"
import { polyglotState } from "@/hooks/useLanguage"
import { generateReadableDate } from "@/utils/date"
import { fetchTweet } from "@/utils/tweet-api"

import SocialCard from "./SocialCard"

import "./TweetEmbed.css"

const formatCount = (value) => {
  if (!Number.isFinite(value)) {
    return null
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}K`
  }
  return String(value)
}

// FxTwitter returns the tweet body as plain text, so linkify the entities that
// X would have rendered as links. Split on the entities themselves so the
// surrounding text is never interpreted as markup.
const ENTITY_PATTERN = /(https?:\/\/\S+|[@#][\w.]+)/g

const renderTweetText = (text) =>
  text.split(ENTITY_PATTERN).map((part, index) => {
    if (!part) {
      return null
    }

    const key = `${index}-${part}`

    if (part.startsWith("http")) {
      return (
        <a key={key} href={part} rel="noopener noreferrer" target="_blank">
          {part}
        </a>
      )
    }

    if (part.startsWith("@")) {
      return (
        <a
          key={key}
          href={`https://x.com/${part.slice(1)}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          {part}
        </a>
      )
    }

    if (part.startsWith("#")) {
      return (
        <a
          key={key}
          href={`https://x.com/hashtag/${encodeURIComponent(part.slice(1))}`}
          rel="noopener noreferrer"
          target="_blank"
        >
          {part}
        </a>
      )
    }

    return <span key={key}>{part}</span>
  })

const TweetEmbed = ({ embed, onUnavailable }) => {
  const { polyglot } = useStore(polyglotState)
  const { handle: authorHandle, id } = embed.match.groups
  const { permalink } = embed

  const [tweet, setTweet] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      try {
        const result = await fetchTweet(authorHandle, id)
        if (!controller.signal.aborted) {
          setTweet(result)
        }
      } catch {
        if (!controller.signal.aborted) {
          onUnavailable?.()
        }
      }
    }

    load()

    return () => controller.abort()
  }, [authorHandle, id, onUnavailable])

  if (!tweet) {
    return null
  }

  const { author, media } = tweet
  const counts = [
    ["replies", tweet.replies],
    ["retweets", tweet.retweets],
    ["likes", tweet.likes],
  ].filter(([, value]) => value > 0)

  return (
    <SocialCard
      avatar={author.avatarUrl}
      href={permalink}
      name={author.name}
      platformId="twitter"
      subtitle={`@${author.screenName}`}
      body={
        <>
          {tweet.text ? <p className="tweet-embed-text">{renderTweetText(tweet.text)}</p> : null}

          {media.photos.length > 0 ? (
            <div
              className={`tweet-embed-media tweet-embed-media-${Math.min(media.photos.length, 4)}`}
            >
              {media.photos.map((photo) => (
                <img key={photo.url} alt="" loading="lazy" src={photo.url} />
              ))}
            </div>
          ) : null}

          {media.videos.map((video) => (
            <PlyrPlayer
              key={video.url}
              poster={video.poster}
              sourceType={video.format}
              src={video.url}
            />
          ))}
        </>
      }
      footer={
        <>
          {tweet.createdTimestamp ? (
            <span>{generateReadableDate(tweet.createdTimestamp * 1000)}</span>
          ) : null}
          {counts.map(([label, value]) => (
            <span key={label}>
              {formatCount(value)} {polyglot.t(`content.tweet_${label}`)}
            </span>
          ))}
        </>
      }
    />
  )
}

export default TweetEmbed
