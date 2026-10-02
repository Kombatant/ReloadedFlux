/* eslint-disable import/extensions */
import assert from "node:assert/strict"
import test from "node:test"

import {
  buildFullTextRssExtractUrl,
  estimateReadingTime,
  hasExtractedContent,
  isFullTextRssActive,
  resolveArticleSrcset,
  resolveArticleUrl,
} from "./full-text-rss.js"

const ARTICLE = "https://example.com/post?id=1&ref=feed"
const ENCODED_ARTICLE = "https%3A%2F%2Fexample.com%2Fpost%3Fid%3D1%26ref%3Dfeed"

test("buildFullTextRssExtractUrl appends extract.php to a server root", () => {
  assert.equal(
    buildFullTextRssExtractUrl("https://ftr.example.com", ARTICLE),
    `https://ftr.example.com/extract.php?url=${ENCODED_ARTICLE}`,
  )
  assert.equal(
    buildFullTextRssExtractUrl("  https://ftr.example.com/// ", ARTICLE),
    `https://ftr.example.com/extract.php?url=${ENCODED_ARTICLE}`,
  )
})

test("buildFullTextRssExtractUrl supports servers hosted under a sub-path", () => {
  assert.equal(
    buildFullTextRssExtractUrl("https://example.com/full-text-rss/", ARTICLE),
    `https://example.com/full-text-rss/extract.php?url=${ENCODED_ARTICLE}`,
  )
})

test("buildFullTextRssExtractUrl keeps an explicit endpoint and its query", () => {
  assert.equal(
    buildFullTextRssExtractUrl("https://ftr.example.com/extract.php?links=preserve", ARTICLE),
    `https://ftr.example.com/extract.php?links=preserve&url=${ENCODED_ARTICLE}`,
  )
})

test("buildFullTextRssExtractUrl rejects unusable input", () => {
  assert.equal(buildFullTextRssExtractUrl("", ARTICLE), null)
  assert.equal(buildFullTextRssExtractUrl(null, ARTICLE), null)
  assert.equal(buildFullTextRssExtractUrl("ftr.example.com", ARTICLE), null)
  assert.equal(buildFullTextRssExtractUrl("ftp://ftr.example.com", ARTICLE), null)
  assert.equal(buildFullTextRssExtractUrl("https://ftr.example.com", ""), null)
})

test("estimateReadingTime uses Miniflux's default reading speed", () => {
  assert.equal(estimateReadingTime(1), 1)
  assert.equal(estimateReadingTime(265), 1)
  assert.equal(estimateReadingTime(266), 2)
  assert.equal(estimateReadingTime(4991), 19)
})

test("estimateReadingTime returns null without a usable word count", () => {
  assert.equal(estimateReadingTime(0), null)
  assert.equal(estimateReadingTime(null), null)
  assert.equal(estimateReadingTime("100"), null)
  assert.equal(estimateReadingTime(Number.NaN), null)
})

test("hasExtractedContent accepts text or media", () => {
  assert.equal(hasExtractedContent("<div><p>Hello</p></div>"), true)
  assert.equal(hasExtractedContent('<figure><img src="a.jpg"></figure>'), true)
})

test("hasExtractedContent rejects empty markup and the failure message", () => {
  assert.equal(hasExtractedContent(""), false)
  assert.equal(hasExtractedContent(null), false)
  assert.equal(hasExtractedContent("<div>\n  <p>&nbsp;</p></div>"), false)
  assert.equal(hasExtractedContent("[unable to retrieve full-text content]"), false)
  assert.equal(
    hasExtractedContent("[unable to retrieve full-text content]<p>Original summary</p>"),
    false,
  )
})

test("resolveArticleUrl resolves relative URLs against the article", () => {
  const base = "https://example.com/blog/post.html"
  assert.equal(resolveArticleUrl("img/a.jpg", base), "https://example.com/blog/img/a.jpg")
  assert.equal(resolveArticleUrl("/a.jpg", base), "https://example.com/a.jpg")
  assert.equal(resolveArticleUrl("//cdn.example.net/a.jpg", base), "https://cdn.example.net/a.jpg")
  assert.equal(resolveArticleUrl("https://other.org/x", base), "https://other.org/x")
})

test("resolveArticleUrl leaves anchors and non-http URLs alone", () => {
  const base = "https://example.com/post"
  assert.equal(resolveArticleUrl("#fn1", base), "#fn1")
  assert.equal(resolveArticleUrl("mailto:me@example.com", base), "mailto:me@example.com")
  assert.equal(resolveArticleUrl("", base), "")
})

test("resolveArticleSrcset resolves each candidate and keeps descriptors", () => {
  assert.equal(
    resolveArticleSrcset("a.jpg 1x,  /b.jpg 2x", "https://example.com/p/post"),
    "https://example.com/p/a.jpg 1x, https://example.com/b.jpg 2x",
  )
  assert.equal(
    resolveArticleSrcset("data:image/png;base64,AAAA 1x", "https://example.com/"),
    "data:image/png;base64,AAAA 1x",
  )
})

test("isFullTextRssActive needs Full-Text RSS selected and a server URL", () => {
  assert.equal(
    isFullTextRssActive({ contentFetcher: "fulltextrss", fullTextRssUrl: "https://ftr" }),
    true,
  )
  assert.equal(isFullTextRssActive({ contentFetcher: "fulltextrss", fullTextRssUrl: "" }), false)
  assert.equal(
    isFullTextRssActive({ contentFetcher: "miniflux", fullTextRssUrl: "https://ftr" }),
    false,
  )
})
