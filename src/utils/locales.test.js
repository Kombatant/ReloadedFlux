/* eslint-disable import/extensions */
import assert from "node:assert/strict"
import test from "node:test"

import { DEFAULT_LANGUAGE, resolveLanguage } from "./locales.js"

test("resolveLanguage keeps supported locales unchanged", () => {
  assert.equal(resolveLanguage("en-CA"), "en-CA")
  assert.equal(resolveLanguage("de-DE"), "de-DE")
  assert.equal(resolveLanguage("el-GR"), "el-GR")
  assert.equal(resolveLanguage("zh-CN"), "zh-CN")
})

test("resolveLanguage falls back to the shipped locale for the same language", () => {
  assert.equal(resolveLanguage("en-GB"), "en-CA")
  assert.equal(resolveLanguage("en-US"), "en-CA")
  assert.equal(resolveLanguage("de-AT"), "de-DE")
  assert.equal(resolveLanguage("es-MX"), "es-ES")
  assert.equal(resolveLanguage("fr-CA"), "fr-FR")
})

test("resolveLanguage maps every Chinese variant to zh-CN", () => {
  assert.equal(resolveLanguage("zh-Hans-CN"), "zh-CN")
  assert.equal(resolveLanguage("zh-TW"), "zh-CN")
  assert.equal(resolveLanguage("zh"), "zh-CN")
})

test("resolveLanguage is case and separator insensitive", () => {
  assert.equal(resolveLanguage("EN-gb"), "en-CA")
  assert.equal(resolveLanguage("de_DE"), "de-DE")
  assert.equal(resolveLanguage("FR"), "fr-FR")
})

test("resolveLanguage falls back to en-CA for unsupported or invalid input", () => {
  assert.equal(resolveLanguage("ja-JP"), DEFAULT_LANGUAGE)
  assert.equal(resolveLanguage("xx"), DEFAULT_LANGUAGE)
  assert.equal(resolveLanguage(""), DEFAULT_LANGUAGE)
  assert.equal(resolveLanguage(null), DEFAULT_LANGUAGE)
  assert.equal(resolveLanguage(), DEFAULT_LANGUAGE)
  assert.equal(resolveLanguage(42), DEFAULT_LANGUAGE)
})
