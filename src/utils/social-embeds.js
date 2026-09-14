/**
 * Detection and rendering strategy for social post embeds.
 *
 * Feeds ship these embeds as a <blockquote> placeholder plus a platform
 * <script> that swaps in the real widget. Miniflux's sanitizer strips the
 * script (and usually the class hook the script keys off), leaving a bare
 * blockquote that renders as an empty box. What survives sanitization is the
 * permalink anchor, so detection keys off that.
 *
 * Whether we can then show the real post depends on the platform's framing
 * headers, verified per platform:
 *   - "iframe" — serves an embed view that permits framing.
 *   - "card"   — blocks framing (x-frame-options / UA redirect), so the best
 *                we can do client-side is a rich link card.
 */

const MASTODON_EXCLUDED_HOSTS = new Set([
  "bsky.app",
  "facebook.com",
  "threads.com",
  "threads.net",
  "www.facebook.com",
  "www.threads.com",
  "www.threads.net",
  "instagram.com",
  "tiktok.com",
  "twitter.com",
  "www.instagram.com",
  "www.tiktok.com",
  "www.twitter.com",
  "x.com",
])

const SOCIAL_EMBED_PLATFORMS = [
  {
    id: "instagram",
    labelKey: "content.social_embed_open_instagram",
    // Every /embed/ variant (plain, captioned, no-trailing-slash) responds with
    // x-frame-options: DENY for a plain iframe request, so an iframe would only
    // ever paint a blank box. Instagram's own embed.js negotiates this; we have
    // no equivalent after sanitization strips it.
    mode: "card",
    pattern: /(?:^|\/\/|\.)instagram\.com\/(?:p|reel|reels|tv)\/(?<shortcode>[\w-]+)/,
    // Instagram post permalinks carry only the shortcode, never the author, so
    // there is no handle to show on the card.
    toHandle: () => null,
  },
  {
    id: "threads",
    labelKey: "content.social_embed_open_threads",
    // Meta serves Threads embeds with x-frame-options: DENY exactly like
    // Instagram, and exposes no CORS-enabled content API, so it gets the same
    // link-card treatment. Both .net and .com hosts are in circulation.
    mode: "card",
    pattern: /(?:^|\/\/|\.)threads\.(?:net|com)\/@(?<handle>[\w.]+)\/post\/(?<shortcode>[\w-]+)/,
    // Unlike Instagram, the Threads permalink names the author.
    toHandle: ({ groups }) => groups.handle,
  },
  {
    id: "facebookVideo",
    aspectRatio: "500 / 480",
    labelKey: "content.social_embed_load_facebook_video",
    maxWidth: 500,
    // Unlike plugins/post.php, plugins/video.php serves without
    // x-frame-options, so Facebook video permalinks can be framed.
    mode: "iframe",
    pattern: /(?:^|\/\/|\.)facebook\.com\/(?<handle>[\w.-]+)\/videos\/(?<id>[\w.-]+)/,
    // Rebuild a canonical permalink from the captured parts: match[0] can start
    // mid-string (the pattern tolerates a leading host segment), so it is not a
    // usable URL on its own.
    toEmbedUrl: ({ groups }) =>
      `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
        `https://www.facebook.com/${groups.handle}/videos/${groups.id}`,
      )}&show_text=false`,
    toHandle: ({ groups }) => groups.handle,
  },
  {
    id: "facebook",
    labelKey: "content.social_embed_open_facebook",
    // plugins/post.php answers x-frame-options: DENY like the rest of Meta, and
    // there is no CORS-enabled content API, so posts get the link card.
    // plugins/video.php is the exception — it frames cleanly — but it is only
    // valid for /videos/ permalinks, handled by the facebookVideo entry above.
    mode: "card",
    pattern:
      /(?:^|\/\/|\.)facebook\.com\/(?<handle>[\w.-]+)\/(?:posts|photos)\/(?<shortcode>[\w.-]+)/,
    toHandle: ({ groups }) => groups.handle,
  },
  {
    id: "twitter",
    // fxtwitter/vxtwitter/fixupx permalinks appear in feeds too, so match them
    // here; they resolve to the same tweet id.
    pattern:
      /(?:^|\/\/|\.)(?:twitter|x|fxtwitter|vxtwitter|fixupx)\.com\/(?<handle>[\w.]+)\/status(?:es)?\/(?<id>\d+)/,
    // X blocks framing and publishes no usable embed URL, but FxTwitter's JSON
    // API is CORS-enabled, so the tweet is fetched and rendered natively.
    // Falls back to the link card if that fetch fails (outage, deleted tweet).
    mode: "tweet",
    toHandle: ({ groups }) => groups.handle,
  },
  {
    id: "bluesky",
    aspectRatio: "600 / 500",
    labelKey: "content.social_embed_load_bluesky",
    maxWidth: 600,
    mode: "iframe",
    pattern: /(?:^|\/\/|\.)bsky\.app\/profile\/(?<handle>[\w.:-]+)\/post\/(?<rkey>[\w]+)/,
    toEmbedUrl: ({ groups }) =>
      `https://embed.bsky.app/embed/${groups.handle}/app.bsky.feed.post/${groups.rkey}`,
    toHandle: ({ groups }) => groups.handle,
  },
  {
    id: "tiktok",
    // Tall portrait video plus a caption strip.
    aspectRatio: "325 / 750",
    labelKey: "content.social_embed_load_tiktok",
    maxWidth: 325,
    mode: "iframe",
    pattern: /(?:^|\/\/|\.)tiktok\.com\/@(?<handle>[\w.-]+)\/video\/(?<id>\d+)/,
    toEmbedUrl: ({ groups }) => `https://www.tiktok.com/embed/v2/${groups.id}`,
    toHandle: ({ groups }) => groups.handle,
  },
  {
    id: "mastodon",
    aspectRatio: "600 / 400",
    labelKey: "content.social_embed_load_mastodon",
    maxWidth: 600,
    mode: "iframe",
    // Mastodon is federated, so the host is not fixed. Match the shape of a
    // status permalink (/@user/<numeric id>) on any host, then exclude the
    // known non-Mastodon domains handled above.
    pattern: /^https?:\/\/(?<host>[\w.-]+)\/@(?<handle>[\w.-]+)(?:@[\w.-]+)?\/(?<id>\d+)\/?$/,
    isSupportedHost: ({ groups }) => !MASTODON_EXCLUDED_HOSTS.has(groups.host.toLowerCase()),
    toEmbedUrl: (match) => `${match[0].replace(/\/$/, "")}/embed`,
    toHandle: ({ groups }) => groups.handle,
  },
]

/**
 * Pull the author out of an Instagram embed fallback's attribution line
 * ("A post shared by Sydney Sweeney (@sydney_sweeney)").
 *
 * Instagram exposes no CORS-enabled content API, so this sentence is the only
 * post metadata available client-side. The wording is localized per feed, but
 * the "(@handle)" suffix is not, so the handle anchors the parse: walk backwards
 * from it and keep the trailing words that plausibly belong to a display name,
 * which drops the localized boilerplate without matching on any language.
 */
const normalizeForHandleMatch = (value) => value.toLowerCase().replaceAll(/[^a-z0-9]/g, "")

export const parseInstagramAttribution = (text) => {
  const match = text?.match(/\(@([\w.]+)\)/)
  if (!match) {
    return null
  }

  const handle = match[1]
  const normalizedHandle = normalizeForHandleMatch(handle)

  const words = text.slice(0, match.index).trim().split(/\s+/)
  const nameWords = []

  for (let index = words.length - 1; index >= 0; index -= 1) {
    const word = words[index]
    const normalizedWord = normalizeForHandleMatch(word)
    const isCapitalized = /^\p{Lu}/u.test(word)
    const belongsToHandle = normalizedWord.length > 0 && normalizedHandle.includes(normalizedWord)

    if (!isCapitalized && !belongsToHandle) {
      break
    }

    nameWords.unshift(word)
  }

  return { handle, name: nameWords.join(" ") || null }
}

/**
 * Match a permalink against the known platforms.
 * Returns { platform, match, permalink } or null when no platform claims it.
 */
export const matchSocialEmbed = (permalink) => {
  if (!permalink) {
    return null
  }

  for (const platform of SOCIAL_EMBED_PLATFORMS) {
    const match = permalink.match(platform.pattern)
    if (match && (platform.isSupportedHost?.(match) ?? true)) {
      return { match, permalink, platform }
    }
  }

  return null
}

export const buildEmbedUrl = ({ match, platform }, options = {}) =>
  platform.toEmbedUrl?.(match, { theme: options.theme ?? "light" }) ?? null

export const buildHandle = ({ match, permalink, platform }) => {
  try {
    return platform.toHandle?.(match, permalink) ?? null
  } catch {
    return null
  }
}

export default SOCIAL_EMBED_PLATFORMS
