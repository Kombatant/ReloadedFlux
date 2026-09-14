import { useStore } from "@nanostores/react"

import { polyglotState } from "@/hooks/useLanguage"
import { buildHandle, parseInstagramAttribution } from "@/utils/social-embeds"

import SocialCard from "./SocialCard"

/**
 * Card for Meta's platforms (Instagram, Threads).
 *
 * Both serve their embed views with x-frame-options: DENY and expose no
 * CORS-enabled content API, so the post itself cannot be rendered client-side.
 * What is available is surfaced instead: Threads names the author in its
 * permalink, and Instagram's embed fallback carries an attribution line.
 */
const MetaPostCard = ({ embed, fallbackText }) => {
  const { polyglot } = useStore(polyglotState)
  const { permalink, platform } = embed

  const attribution = parseInstagramAttribution(fallbackText)
  const handle = attribution?.handle ?? buildHandle(embed)
  const isReel = /\/(?:reel|reels)\//.test(permalink)

  const kindKey = {
    facebook: "content.facebook_card_post",
    threads: "content.threads_card_post",
  }[platform.id]

  const kind = polyglot.t(
    kindKey ?? (isReel ? "content.instagram_card_reel" : "content.instagram_card_post"),
  )

  return (
    <SocialCard
      isLink
      footer={<span>{polyglot.t(platform.labelKey)}</span>}
      href={permalink}
      platformId={platform.id}
      subtitle={handle ? `@${handle} · ${kind}` : kind}
      name={
        attribution?.name ?? handle ?? polyglot.t(`content.social_embed_platform_${platform.id}`)
      }
    />
  )
}

export default MetaPostCard
