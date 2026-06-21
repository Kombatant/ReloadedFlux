import { map } from "nanostores"

export const connectionState = map({
  isServerUnreachable: false,
})

export const setServerUnreachable = (isServerUnreachable) =>
  connectionState.setKey("isServerUnreachable", isServerUnreachable)
