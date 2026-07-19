import { atom } from "nanostores"

import createSetter from "@/utils/nanostores"

// True while the stream alignment state machine (useStreamKeyHandlers) is
// scrolling the selected card to the top. Load-more consults this so an
// append never lands mid-glide — the 300-entry remeasure would knock the
// animated scroll off its target — and StoryStream re-runs its load-more
// check when the flag flips back to false, so keyboard-only navigation
// (whose scroll events all happen during alignment) still loads more.
export const streamAlignmentActiveState = atom(false)

export const setStreamAlignmentActive = createSetter(streamAlignmentActiveState)
