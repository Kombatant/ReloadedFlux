/**
 * Fetch tweet data via FxTwitter's JSON API.
 *
 * X blocks framing and its unofficial embed endpoint is unreliable, but
 * FxTwitter exposes the tweet as CORS-enabled JSON (access-control-allow-origin:
 * *), so the post can be fetched and rendered natively instead of iframed.
 *
 * Note this is the api.* host, not fxtwitter.com itself — the HTML site
 * User-Agent-sniffs and redirects browsers to x.com, so only the API is usable
 * from the client.
 */

const API_BASE = "https://api.fxtwitter.com"
const REQUEST_TIMEOUT_MS = 10_000

// Tweets are immutable, so a fetched result stays valid for the session. Shared
// across cards so the same tweet quoted twice is fetched once.
const tweetCache = new Map()

const normalizeMedia = (media) => {
  if (!media) {
    return { photos: [], videos: [] }
  }

  return {
    photos: (media.photos ?? []).map((photo) => ({
      height: photo.height,
      url: photo.url,
      width: photo.width,
    })),
    videos: (media.videos ?? []).map((video) => ({
      format: video.format,
      poster: video.thumbnail_url,
      type: video.type,
      url: video.url,
    })),
  }
}

const normalizeTweet = (tweet) => ({
  author: {
    avatarUrl: tweet.author?.avatar_url ?? null,
    name: tweet.author?.name ?? null,
    screenName: tweet.author?.screen_name ?? null,
  },
  createdAt: tweet.created_at ?? null,
  createdTimestamp: tweet.created_timestamp ?? null,
  likes: tweet.likes ?? 0,
  media: normalizeMedia(tweet.media),
  replies: tweet.replies ?? 0,
  retweets: tweet.retweets ?? 0,
  text: tweet.text ?? "",
  url: tweet.url ?? null,
  views: tweet.views ?? null,
})

export const fetchTweet = async (handle, id) => {
  const cacheKey = `${handle}/${id}`

  const cached = tweetCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const request = (async () => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(`${API_BASE}/${handle}/status/${id}`, {
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`FxTwitter responded ${response.status}`)
      }

      const payload = await response.json()
      if (payload.code !== 200 || !payload.tweet) {
        throw new Error(`FxTwitter returned code ${payload.code}`)
      }

      return normalizeTweet(payload.tweet)
    } finally {
      clearTimeout(timeoutId)
    }
  })()

  // Cache the promise so concurrent cards share one request; drop it on failure
  // so a transient error can be retried.
  tweetCache.set(cacheKey, request)
  request.catch(() => tweetCache.delete(cacheKey))

  return request
}

export default fetchTweet
