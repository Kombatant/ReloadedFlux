export const extractImageSources = (htmlString) => {
  const doc = new DOMParser().parseFromString(htmlString, "text/html")
  const images = doc.querySelectorAll("img")
  return [...images].map((img) => img.getAttribute("src"))
}

export const getEntryImageSources = (entry) =>
  entry.imageSources ?? extractImageSources(entry.content)

const cachedImageMetadata = new Map()
const pendingImageMetadata = new Map()

export const getCachedImageMetadata = (src) => {
  if (!src) {
    return null
  }

  return cachedImageMetadata.get(src) ?? null
}

export const preloadImageMetadata = (src) => {
  if (!src || typeof Image !== "function") {
    return Promise.resolve(null)
  }

  const cachedMetadata = cachedImageMetadata.get(src)
  if (cachedMetadata) {
    return Promise.resolve(cachedMetadata)
  }

  const pendingMetadata = pendingImageMetadata.get(src)
  if (pendingMetadata) {
    return pendingMetadata
  }

  const metadataPromise = new Promise((resolve) => {
    const img = new Image()

    const clearPending = () => {
      pendingImageMetadata.delete(src)
      img.removeEventListener("load", handleLoad)
      img.removeEventListener("error", handleError)
    }

    const handleLoad = () => {
      const metadata = {
        height: img.naturalHeight || img.height,
        width: img.naturalWidth || img.width,
      }

      cachedImageMetadata.set(src, metadata)
      clearPending()
      resolve(metadata)
    }

    const handleError = () => {
      clearPending()
      resolve(null)
    }

    img.decoding = "async"
    img.addEventListener("load", handleLoad)
    img.addEventListener("error", handleError)
    img.src = src
  })

  pendingImageMetadata.set(src, metadataPromise)
  return metadataPromise
}

const extractPreviewText = (doc) => {
  const textContent = doc.body?.textContent || ""
  return textContent.replaceAll(/\s+/g, " ").trim()
}

const getWeiboFirstImage = (docs) => {
  const allImages = [...docs.querySelectorAll("img")]
  const filteredImages = allImages.filter((img) => {
    return !img.closest("a") && !(img.hasAttribute("alt") && /\[.+]/.test(img.getAttribute("alt")))
  })
  return filteredImages.length > 0 ? filteredImages[0] : null
}

const findMediaEnclosure = (enclosures) => {
  return enclosures?.find(
    (enclosure) =>
      enclosure.url !== "" &&
      (enclosure.mime_type.startsWith("video/") || enclosure.mime_type.startsWith("audio/")),
  )
}

const findImageEnclosure = (enclosures) => {
  return enclosures?.find(
    (enclosure) =>
      enclosure.mime_type.toLowerCase().startsWith("image/") ||
      /\.(jpg|jpeg|png|gif)$/i.test(enclosure.url),
  )
}

export const parseCoverImage = (entry) => {
  const doc = new DOMParser().parseFromString(entry.content, "text/html")
  const isWeiboFeed =
    entry.feed?.site_url && /https:\/\/weibo\.com\/\d+\//.test(entry.feed.site_url)
  const imageSources = [...doc.querySelectorAll("img")].map((img) => img.getAttribute("src"))
  const previewText = extractPreviewText(doc)

  // Get the first image
  const firstImage = isWeiboFeed ? getWeiboFirstImage(doc) : doc.querySelector("img")

  let coverSource = firstImage?.getAttribute("src")
  let isMedia = false
  let mediaPlayerEnclosure = null

  // If no cover image is found, try to get from other sources
  if (!coverSource) {
    // Check video poster
    const video = doc.querySelector("video")
    if (video) {
      coverSource = video.getAttribute("poster")
      isMedia = true
    } else {
      // Check media attachments
      mediaPlayerEnclosure = findMediaEnclosure(entry.enclosures)
      isMedia = !!mediaPlayerEnclosure

      // Check image attachments
      const imageEnclosure = findImageEnclosure(entry.enclosures)
      if (imageEnclosure) {
        coverSource = imageEnclosure.url
      }
    }

    // Check iframe
    if (!isMedia) {
      const iframe = doc.querySelector("iframe")
      const iframeHost = iframe?.getAttribute("src")?.split("/", 3)[2]
      isMedia = !!iframeHost
    }
  }

  return {
    ...entry,
    coverSource,
    imageSources,
    isMedia,
    mediaPlayerEnclosure,
    previewText,
  }
}
