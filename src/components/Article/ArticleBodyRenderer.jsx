import { useStore } from "@nanostores/react"
import ReactHtmlParser, { domToReact } from "html-react-parser"
import { littlefoot } from "littlefoot"
import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import Lightbox from "yet-another-react-lightbox"
import Counter from "yet-another-react-lightbox/plugins/counter"
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen"
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import "yet-another-react-lightbox/styles.css"
import "yet-another-react-lightbox/plugins/counter.css"

import PlyrPlayer from "@/components/ui/PlyrPlayer"
import { settingsState } from "@/store/settingsState"
import htmlAttributesToProps from "@/utils/html"
import { extractImageSources } from "@/utils/images"
import { matchSocialEmbed } from "@/utils/social-embeds"

import CodeBlock from "./CodeBlock"
import ImageLinkTag from "./ImageLinkTag"
import ImageOverlayButton from "./ImageOverlayButton"
import SocialEmbed from "./SocialEmbed"
import "./ArticleDetail.css"
import "./littlefoot.css"

const handleBskyVideo = (node) => {
  const isBskyVideo = /video\.bsky\.app.*thumbnail\.jpg$/.test(node.attribs.src)
  if (isBskyVideo) {
    const thumbnailUrl = node.attribs.src
    const playlistUrl = thumbnailUrl.replace("thumbnail.jpg", "playlist.m3u8")

    return <PlyrPlayer poster={thumbnailUrl} src={playlistUrl} />
  }
  return null
}

const handleImage = (node, imageSources, togglePhotoSlider) => {
  const bskyVideoPlayer = handleBskyVideo(node)
  if (bskyVideoPlayer) {
    return bskyVideoPlayer
  }

  const index = imageSources.indexOf(node.attribs.src)
  return <ImageOverlayButton index={index} node={node} togglePhotoSlider={togglePhotoSlider} />
}

const handleLinkWithImage = (node, imageSources, togglePhotoSlider) => {
  const imgNodes = node.children.filter((child) => child.type === "tag" && child.name === "img")

  if (imgNodes.length > 0) {
    if (imgNodes.length > 1) {
      return (
        <div className="image-wrapper">
          <div className="image-container">
            {imgNodes.map((imgNode, index) => (
              <div key={`link-img-${index}`}>
                {handleImage(imgNode, imageSources, togglePhotoSlider)}
              </div>
            ))}
            <ImageLinkTag href={node.attribs.href} />
          </div>
        </div>
      )
    }

    const index = imageSources.indexOf(imgNodes[0].attribs.src)
    return (
      <ImageOverlayButton
        index={index}
        isLinkWrapper={true}
        node={node}
        togglePhotoSlider={togglePhotoSlider}
      />
    )
  }
  return node
}

const htmlEntities = {
  "&#39;": "'",
  "&quot;": '"',
  "&lt;": "<",
  "&gt;": ">",
  "&amp;": "&",
}

const decodeAndParseCodeContent = (preElement) => {
  return preElement.children
    .map((child) => {
      if (child.type === "tag" && child.name === "p") {
        return `${child.children[0]?.data ?? ""}\n`
      }
      if (child.type === "tag" && child.name === "strong") {
        return child.children[0]?.data ?? ""
      }
      return child.data ?? (child.name === "br" ? "\n" : "")
    })
    .join("")
    .replaceAll(
      new RegExp(Object.keys(htmlEntities).join("|"), "g"),
      (match) => htmlEntities[match],
    )
}

const handleTableBasedCode = (node) => {
  const tbody = node.children.find((child) => child.name === "tbody")
  if (!tbody) {
    return null
  }

  const tr = tbody.children.find((child) => child.name === "tr")
  if (!tr) {
    return null
  }

  const tdElements = tr.children.filter((child) => child.name === "td")
  if (tdElements.length !== 2) {
    return null
  }

  const [, codeTd] = tdElements
  const codePre = codeTd.children.find((child) => child.name === "pre")

  if (!codePre) {
    return null
  }

  const codeElement = codePre.children?.find((child) => child.name === "code")
  if (codeElement) {
    return decodeAndParseCodeContent(codeElement)
  }

  return decodeAndParseCodeContent(codePre)
}

const handleContentTable = (node) => {
  const tbody = node.children.find((child) => child.name === "tbody")
  if (!tbody) {
    return null
  }

  for (const tr of tbody.children) {
    if (tr.name === "tr") {
      tr.children = tr.children.filter(
        (td) =>
          td.name === "td" &&
          td.children?.length > 0 &&
          td.children.some((child) => child.data?.trim() || child.children?.length),
      )
    }
  }

  return node
}

const processFigcaptionContent = (children) => {
  if (!children) {
    return null
  }

  return children.map((child, index) => {
    if (child.type === "text") {
      return child.data
    }
    if (child.type === "tag") {
      const Tag = child.name
      const props = htmlAttributesToProps(child.attribs, child.name)

      if (child.name === "br") {
        return null
      }

      return (
        <Tag key={index} {...props}>
          {child.children ? processFigcaptionContent(child.children) : null}
        </Tag>
      )
    }
    return null
  })
}

const handleFigure = (node, imageSources, togglePhotoSlider, options) => {
  const firstChild = node.children[0]
  const hasImages = node.children.some((child) => child.name === "img")

  if (firstChild?.name === "pre") {
    const codeContent = decodeAndParseCodeContent(firstChild)
    return codeContent ? <CodeBlock>{codeContent}</CodeBlock> : null
  }

  if (firstChild?.name === "table") {
    const codeContent = handleTableBasedCode(firstChild)
    return codeContent ? <CodeBlock>{codeContent}</CodeBlock> : null
  }

  if (hasImages) {
    return (
      <figure>
        {node.children.map((child, index) => {
          if (child.name === "img") {
            return (
              <div key={`figure-img-${index}`}>
                {handleImage(child, imageSources, togglePhotoSlider)}
              </div>
            )
          }
          if (child.name === "figcaption") {
            return (
              <figcaption key={`figure-caption-${index}`}>
                {processFigcaptionContent(child.children)}
              </figcaption>
            )
          }
          return <Fragment key={`figure-child-${index}`}>{domToReact([child], options)}</Fragment>
        })}
      </figure>
    )
  }

  return null
}

const handleCodeBlock = (node) => {
  let currentNode = node.next
  while (currentNode) {
    const nextNode = currentNode.next
    const isLineNumber = currentNode.type === "text" && /^\d+(<br>|\n)*/.test(currentNode.data)
    const isBreak = currentNode.type === "tag" && currentNode.name === "br"

    if (isLineNumber || isBreak) {
      currentNode.data = ""
      currentNode.type = "text"
    }
    currentNode = nextNode
  }

  const codeContent =
    node.children[0]?.name === "code"
      ? decodeAndParseCodeContent(node.children[0])
      : decodeAndParseCodeContent(node)

  return <CodeBlock>{codeContent}</CodeBlock>
}

const handleVideo = (node) => {
  const sourceNode = node.children?.find((child) => child.name === "source" && child.attribs?.src)

  const videoSrc = sourceNode?.attribs.src || node.attribs.src

  if (!videoSrc) {
    return node
  }

  return (
    <PlyrPlayer poster={node.attribs.poster} sourceType={sourceNode?.attribs.type} src={videoSrc} />
  )
}

const handleIframe = (node) => {
  const src = node.attribs?.src

  if (src && (src.includes("youtube.com") || src.includes("youtube-nocookie.com"))) {
    return (
      <iframe
        {...htmlAttributesToProps(node.attribs, "iframe")}
        referrerPolicy="strict-origin-when-cross-origin"
      />
    )
  }

  return node
}

const findSocialPermalink = (node) => {
  // The original markup hangs the permalink off a data attribute; sanitizers
  // usually drop it, so fall back to scanning the surviving anchors.
  const dataPermalink = node.attribs?.["data-instgrm-permalink"]
  if (dataPermalink && matchSocialEmbed(dataPermalink)) {
    return dataPermalink
  }

  const stack = [...(node.children ?? [])]
  while (stack.length > 0) {
    const child = stack.shift()
    if (child.type === "tag") {
      if (child.name === "a" && matchSocialEmbed(child.attribs?.href ?? "")) {
        return child.attribs.href
      }
      stack.push(...(child.children ?? []))
    }
  }

  return null
}

// Text the blockquote renders outside its anchors. An Instagram placeholder has
// none (all its wording lives inside the permalink links); a hand-written
// pull-quote has its own prose.
const collectTextOutsideLinks = (node) => {
  let text = ""
  const stack = [...(node.children ?? [])]

  while (stack.length > 0) {
    const child = stack.shift()
    if (child.type === "text") {
      text += child.data ?? ""
    } else if (child.type === "tag" && child.name !== "a") {
      stack.push(...(child.children ?? []))
    }
  }

  return text.trim()
}

// Twitter/X oEmbed fallbacks carry the tweet text in the blockquote body, so the
// "no prose" test cannot identify them. They instead end with an attribution run
// — "— Author (@handle)" immediately followed by the status permalink — which a
// hand-written pull-quote citing a tweet will not have.
//
// Miniflux rewraps the fallback's contents in a <p>, and the em dash often ends
// up glued to the tweet's last word ("...OTA.— Author (@handle)"), so match the
// attribution inside any text node rather than expecting a standalone one.
const TWEET_ATTRIBUTION_PATTERN = /[—–-]\s*[^()]*\(@[\w.]+\)\s*$/

const flattenNodes = (node) => {
  const flat = []
  const stack = [...(node.children ?? [])]

  while (stack.length > 0) {
    const child = stack.shift()
    flat.push(child)
    if (child.type === "tag" && child.name !== "a") {
      stack.unshift(...(child.children ?? []))
    }
  }

  return flat
}

const hasTweetAttribution = (node, permalink) => {
  const flat = flattenNodes(node)

  // Locate the status permalink, then confirm the text just before it is an
  // attribution run.
  const anchorIndex = flat.findIndex(
    (child) => child.type === "tag" && child.name === "a" && child.attribs?.href === permalink,
  )

  if (anchorIndex === -1) {
    return false
  }

  for (let index = anchorIndex - 1; index >= 0; index -= 1) {
    const child = flat[index]
    if (child.type === "text") {
      const text = child.data.trim()
      if (text) {
        return TWEET_ATTRIBUTION_PATTERN.test(text)
      }
    } else if (child.type === "tag" && child.name === "a") {
      // Handle mentions (@user links) sit between the body and the attribution
      // in some fallbacks; keep scanning past them.
      continue
    }
  }

  return false
}

const isEmbedPlaceholder = (node, embed) => {
  if (embed.platform.id === "twitter") {
    return hasTweetAttribution(node, embed.permalink)
  }

  // Every other platform's fallback keeps its wording inside the permalink
  // anchors, so any prose of its own means this is a real quote.
  return collectTextOutsideLinks(node).length === 0
}

// The Instagram fallback's attribution sits inside its anchors, so this collects
// every text node rather than only the ones outside links.
const collectAllText = (node) => {
  let text = ""
  const stack = [...(node.children ?? [])]

  while (stack.length > 0) {
    const child = stack.shift()
    if (child.type === "text") {
      text += child.data ?? ""
    } else if (child.type === "tag") {
      stack.unshift(...(child.children ?? []))
    }
  }

  return text
}

const handleBlockquote = (node) => {
  // Sanitizers strip the class hook and the platform <script>, so the embed
  // arrives as a bare blockquote. Detect it by the permalink that survives.
  const permalink = findSocialPermalink(node)
  const embed = matchSocialEmbed(permalink)

  if (!embed) {
    return node
  }

  // Guard against converting a genuine pull-quote that merely cites a post.
  if (!isEmbedPlaceholder(node, embed)) {
    return node
  }

  return <SocialEmbed embed={embed} fallbackText={collectAllText(node)} />
}

const PARAGRAPH_BLOCK_CHILDREN = new Set(["figure", "iframe", "img", "pre", "table", "video"])

const paragraphContainsBlockContent = (node) =>
  node.children?.some((child) => {
    if (child.type !== "tag") {
      return false
    }

    if (PARAGRAPH_BLOCK_CHILDREN.has(child.name)) {
      return true
    }

    return (
      child.name === "a" &&
      child.children?.some((grandchild) => grandchild.type === "tag" && grandchild.name === "img")
    )
  }) ?? false

const handleParagraph = (node, options) => {
  if (!paragraphContainsBlockContent(node)) {
    return node
  }

  const { className, ...restProps } = htmlAttributesToProps(node.attribs, "div")

  return (
    <div
      {...restProps}
      className={["article-paragraph-block", className].filter(Boolean).join(" ")}
    >
      {domToReact(node.children, options)}
    </div>
  )
}

const getHtmlParserOptions = (imageSources, togglePhotoSlider) => {
  const options = {
    replace: (node) => {
      if (node.type !== "tag") {
        return node
      }

      switch (node.name) {
        case "a": {
          return node.children.length > 0
            ? handleLinkWithImage(node, imageSources, togglePhotoSlider)
            : node
        }
        case "img": {
          return handleImage(node, imageSources, togglePhotoSlider)
        }
        case "pre": {
          return handleCodeBlock(node)
        }
        case "figure": {
          return handleFigure(node, imageSources, togglePhotoSlider, options)
        }
        case "video": {
          return handleVideo(node)
        }
        case "iframe": {
          return handleIframe(node)
        }
        case "p": {
          return handleParagraph(node, options)
        }
        case "table": {
          return handleContentTable(node)
        }
        case "blockquote": {
          return handleBlockquote(node)
        }
        default: {
          return node
        }
      }
    },
  }

  return options
}

const ArticleBodyRenderer = ({ entry, lightboxState = null, maxWidth = "100%" }) => {
  const { animationsEnabled, articleWidth, edgeToEdgeImages, fontFamily, fontSize } =
    useStore(settingsState)

  const [localPhotoSliderVisible, setLocalPhotoSliderVisible] = useState(false)
  const [localSelectedIndex, setLocalSelectedIndex] = useState(0)
  // The Lightbox widget is heavy and, in the stream's full-body mode, one is
  // mounted per card — dozens at once, tanking scroll paint/composite. Defer
  // mounting it until this card's slider is first opened; a closed-but-never-
  // opened lightbox renders nothing and stays out of the scroll DOM.
  const [lightboxEverOpened, setLightboxEverOpened] = useState(false)

  const isPhotoSliderVisible = lightboxState?.isPhotoSliderVisible ?? localPhotoSliderVisible
  const selectedIndex = lightboxState?.selectedIndex ?? localSelectedIndex
  const setIsPhotoSliderVisible =
    lightboxState?.setIsPhotoSliderVisible ?? setLocalPhotoSliderVisible
  const setSelectedIndex = lightboxState?.setSelectedIndex ?? setLocalSelectedIndex

  const togglePhotoSlider = useCallback(
    (index) => {
      setLightboxEverOpened(true)
      setSelectedIndex(index)
      setIsPhotoSliderVisible((prev) => !prev)
    },
    [setIsPhotoSliderVisible, setSelectedIndex],
  )

  // Mount the Lightbox once this card's slider has ever been opened — either via
  // a local image click (lightboxEverOpened) or an external owner driving
  // visibility (isPhotoSliderVisible), so keyboard/photo-slider entry points
  // still work. Until then it stays out of the DOM to keep the stream light.
  const shouldMountLightbox = lightboxEverOpened || isPhotoSliderVisible

  const imageSources = useMemo(
    () => entry.imageSources ?? extractImageSources(entry.content),
    [entry.content, entry.imageSources],
  )
  const hasImages = imageSources.length > 0
  const htmlParserOptions = useMemo(
    () => getHtmlParserOptions(imageSources, togglePhotoSlider),
    [imageSources, togglePhotoSlider],
  )
  const parsedHtml = useMemo(
    () => ReactHtmlParser(entry.content, htmlParserOptions),
    [entry.content, htmlParserOptions],
  )

  const lightboxAnimationConfig = animationsEnabled ? { fade: 250 } : { fade: 250, navigation: 0 }
  const { coverSource, mediaPlayerEnclosure, isMedia } = entry

  useEffect(() => {
    const lf = littlefoot()
    return () => {
      lf.unmount()
    }
  }, [entry.id])

  return (
    <div
      className={["article-content", "article-body-shell", edgeToEdgeImages ? "edge-to-edge" : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        key={entry.id}
        className="article-body"
        style={{
          fontSize: `${fontSize}rem`,
          maxWidth,
          fontFamily,
          "--article-width": articleWidth,
        }}
      >
        {isMedia && mediaPlayerEnclosure && (
          <PlyrPlayer
            enclosure={mediaPlayerEnclosure}
            poster={coverSource}
            src={mediaPlayerEnclosure.url}
            style={{
              maxWidth: mediaPlayerEnclosure.mime_type.startsWith("video/") ? "100%" : "400px",
            }}
          />
        )}
        {parsedHtml}
        {hasImages && shouldMountLightbox ? (
          <Lightbox
            animation={lightboxAnimationConfig}
            carousel={{ finite: true, padding: 0 }}
            close={() => setIsPhotoSliderVisible(false)}
            controller={{ closeOnBackdropClick: true }}
            index={selectedIndex}
            open={isPhotoSliderVisible}
            plugins={[Counter, Fullscreen, Zoom]}
            slides={imageSources.map((item) => ({ src: item }))}
            on={{
              view: ({ index }) => setSelectedIndex(index),
            }}
          />
        ) : null}
      </div>
    </div>
  )
}

export default ArticleBodyRenderer
