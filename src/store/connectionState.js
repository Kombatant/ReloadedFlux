import { map } from "nanostores"

// error describes why the server was marked unreachable: { status, statusText }
// for a gateway response, or { status: null, message } for a network failure.
export const connectionState = map({
  isServerUnreachable: false,
  error: null,
})

export const setServerUnreachable = (isServerUnreachable, error = null) =>
  connectionState.set({ isServerUnreachable, error: isServerUnreachable ? error : null })
