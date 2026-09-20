/* eslint-disable import/extensions */
import assert from "node:assert/strict"
import { test } from "node:test"

import {
  AI_SUMMARY_LANGUAGE_AUTO,
  buildSummaryPrompt,
  formatSummaryHtml,
  stripDetectedLanguageLine,
} from "./ai.js"

const ARTICLE = "Content body."

test("auto mode asks the model to detect the language instead of naming one", () => {
  const prompt = buildSummaryPrompt("Title", ARTICLE, {
    targetLanguage: AI_SUMMARY_LANGUAGE_AUTO,
    excludedLanguage: "",
  })

  assert.match(prompt, /Identify the language the article below is written in/)
  assert.match(prompt, /DETECTED LANGUAGE: <language name in English>/)
  assert.match(prompt, /Do not translate/)
  // The regression that shipped to users: auto must never instruct a fixed target.
  assert.doesNotMatch(prompt, /LANGUAGE: Write the summary in (English|French|German)\./)
})

test("auto mode repeats the constraint so long generations cannot drift", () => {
  const prompt = buildSummaryPrompt("Title", ARTICLE, {
    targetLanguage: AI_SUMMARY_LANGUAGE_AUTO,
  })

  // A 3B Mistral build detected English, then wrote the bullets in French anyway.
  assert.match(prompt, /Every single bullet point must be written in that same identified language/)
  assert.match(prompt, /even if it is not the language you would normally use/)
  assert.match(prompt, /Do not mix languages/)
})

test("an explicit target repeats the language name per bullet", () => {
  const prompt = buildSummaryPrompt("Title", ARTICLE, { targetLanguage: "el-GR" })

  assert.match(prompt, /Every single bullet point must be written in Greek/)
  assert.match(prompt, /even if Greek is not the language you would normally use/)
})

test("auto mode ignores a stale excluded language left over from a previous selection", () => {
  const withStale = buildSummaryPrompt("Title", ARTICLE, {
    targetLanguage: AI_SUMMARY_LANGUAGE_AUTO,
    excludedLanguage: "fr-FR",
  })
  const withoutStale = buildSummaryPrompt("Title", ARTICLE, {
    targetLanguage: AI_SUMMARY_LANGUAGE_AUTO,
    excludedLanguage: "",
  })

  assert.equal(withStale, withoutStale)
  assert.doesNotMatch(withStale, /keep the summary in French/)
})

test("an explicit language names that language as the target", () => {
  const prompt = buildSummaryPrompt("Title", ARTICLE, {
    targetLanguage: "fr-FR",
    excludedLanguage: "",
  })

  assert.match(prompt, /LANGUAGE: Write the summary in French\./)
  assert.doesNotMatch(prompt, /Identify the language/)
})

test("an excluded language is honoured only alongside an explicit target", () => {
  const prompt = buildSummaryPrompt("Title", ARTICLE, {
    targetLanguage: "en-CA",
    excludedLanguage: "el-GR",
  })

  assert.match(prompt, /LANGUAGE: Write the summary in English\./)
  assert.match(prompt, /if the article is written in Greek, keep the summary in Greek/)
})

test("an unset language falls back to English rather than detection", () => {
  const prompt = buildSummaryPrompt("Title", ARTICLE, {})

  assert.match(prompt, /LANGUAGE: Write the summary in English\./)
})

test("the title is included when present and omitted when blank", () => {
  const withTitle = buildSummaryPrompt("  Headline  ", ARTICLE, {
    targetLanguage: AI_SUMMARY_LANGUAGE_AUTO,
  })
  const withoutTitle = buildSummaryPrompt(" ".repeat(3), ARTICLE, {
    targetLanguage: AI_SUMMARY_LANGUAGE_AUTO,
  })

  assert.match(withTitle, /Title: Headline\n/)
  assert.doesNotMatch(withoutTitle, /Title:/)
})

test("the detected-language line is stripped however the model decorated it", () => {
  const variants = [
    "DETECTED LANGUAGE: English\n- First point",
    "**DETECTED LANGUAGE: English**\n- First point",
    "  detected language: English  \n- First point",
    "`DETECTED LANGUAGE: Greek`\n- First point",
  ]

  for (const variant of variants) {
    assert.equal(stripDetectedLanguageLine(variant).trim(), "- First point", variant)
  }
})

test("a free-form language preamble is stripped too", () => {
  // Verbatim shape returned by ministral-3:3b for an English article.
  const summary = "**Le texte est écrit en anglais.**\n- Premier point"

  assert.equal(stripDetectedLanguageLine(summary).trim(), "- Premier point")
  assert.equal(
    stripDetectedLanguageLine("The article is written in English.\n- First point").trim(),
    "- First point",
  )
})

test("stripping never eats a real bullet", () => {
  const summary = "- The language model shipped today\n- Second point"

  assert.equal(stripDetectedLanguageLine(summary), summary)
})

test("formatSummaryHtml drops the language line instead of rendering it as a bullet", () => {
  const html = formatSummaryHtml("DETECTED LANGUAGE: English\n- First point\n- Second point", "S")

  assert.doesNotMatch(html, /DETECTED LANGUAGE/)
  assert.match(html, /First point/)
  assert.match(html, /Second point/)
})
