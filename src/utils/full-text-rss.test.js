/* eslint-disable import/extensions */
import assert from "node:assert/strict"
import test from "node:test"

import { buildFullTextRssExtractUrl, estimateReadingTime } from "./full-text-rss.js"

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
