// Opt-in debug tracing for the stream (combined layout) scroll/alignment
// pipeline. Used to troubleshoot stutters and "selected card didn't move to
// the top" reports without spamming the console for regular users.
//
// Enable from the browser console with either:
//   __streamScrollDebug(true)                                  // persists
//   localStorage.setItem("reloadedflux:debug-stream-scroll", "1")
// The __streamScrollDebug toggle applies immediately (no reload needed).
// Disable with __streamScrollDebug(false).
//
// Every line is prefixed with the ms-since-page-load timestamp and the delta
// since the previous stream-scroll log, so frame drops and long gaps between
// pipeline steps are visible directly in the log. While enabled, a rAF loop
// additionally logs "frame:long" whenever the main thread was blocked past a
// vsync interval — the visible stutter — so the jank lands on the same
// timeline as the scroll pipeline events that preceded it.

const STORAGE_KEY = "reloadedflux:debug-stream-scroll"
const LONG_FRAME_THRESHOLD_MS = 50

const readPersistedFlag = () => {
  try {
    return globalThis.localStorage?.getItem(STORAGE_KEY) === "1"
  } catch {
    return false
  }
}

let enabled = readPersistedFlag()
let lastLogAt = null
let frameMonitorId = null

const now = () =>
  typeof globalThis.performance?.now === "function" ? globalThis.performance.now() : Date.now()

export const isStreamDebugEnabled = () => enabled

// streamDebug("event", { detail: 1 }) or streamDebug("event", () => expensive())
// — pass a function for details that require extra layout reads so they only
// run when debugging is on.
export const streamDebug = (event, details) => {
  if (!enabled) {
    return
  }

  const timestamp = now()
  const delta = lastLogAt === null ? 0 : timestamp - lastLogAt
  lastLogAt = timestamp

  const resolvedDetails = typeof details === "function" ? details() : details
  const prefix = `[stream-scroll ${timestamp.toFixed(1)}ms +${delta.toFixed(1)}ms] ${event}`

  if (resolvedDetails === undefined) {
    console.log(prefix)
  } else {
    console.log(prefix, resolvedDetails)
  }
}

let visibilityListener = null

const stopLongFrameMonitor = () => {
  if (frameMonitorId !== null && typeof globalThis.cancelAnimationFrame === "function") {
    globalThis.cancelAnimationFrame(frameMonitorId)
  }
  frameMonitorId = null
  if (visibilityListener) {
    globalThis.document?.removeEventListener?.("visibilitychange", visibilityListener)
    visibilityListener = null
  }
}

const startLongFrameMonitor = () => {
  if (frameMonitorId !== null || typeof globalThis.requestAnimationFrame !== "function") {
    return
  }

  // Hidden/occluded tabs get their rAF throttled to ~1Hz (or paused) by the
  // browser — those multi-second gaps are deliberate idling, not jank, and
  // logging them as frame:long is pure noise. Skip ticks while hidden and
  // reset the baseline on every visibility flip so the first visible frame
  // after a tab switch isn't blamed for the whole hidden period.
  let lastFrameAt = now()
  visibilityListener = () => {
    lastFrameAt = now()
  }
  globalThis.document?.addEventListener?.("visibilitychange", visibilityListener)

  const tick = () => {
    if (!enabled) {
      frameMonitorId = null
      return
    }
    const timestamp = now()
    const gap = timestamp - lastFrameAt
    const isHidden = globalThis.document?.hidden ?? false
    if (gap >= LONG_FRAME_THRESHOLD_MS && !isHidden) {
      streamDebug("frame:long", { blockedMs: Math.round(gap) })
    }
    lastFrameAt = timestamp
    frameMonitorId = globalThis.requestAnimationFrame(tick)
  }
  frameMonitorId = globalThis.requestAnimationFrame(tick)
}

export const setStreamDebugEnabled = (value) => {
  enabled = Boolean(value)
  lastLogAt = null
  try {
    if (enabled) {
      globalThis.localStorage?.setItem(STORAGE_KEY, "1")
    } else {
      globalThis.localStorage?.removeItem(STORAGE_KEY)
    }
  } catch {
    // Storage unavailable (private mode etc.) — the in-memory flag still works.
  }
  if (enabled) {
    startLongFrameMonitor()
  } else {
    stopLongFrameMonitor()
  }
  console.info(`[stream-scroll] debug logging ${enabled ? "enabled" : "disabled"}`)
}

// Console toggle. Guarded so importing this module in tests/Node is harmless.
if (typeof globalThis !== "undefined") {
  globalThis.__streamScrollDebug = setStreamDebugEnabled
}

if (enabled) {
  startLongFrameMonitor()
}
