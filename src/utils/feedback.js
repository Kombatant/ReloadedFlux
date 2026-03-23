import { Message as ArcoMessage, Notification as ArcoNotification } from "@arco-design/web-react"

const getStableText = (value) => {
  if (typeof value === "string" || typeof value === "number") {
    return String(value)
  }

  return null
}

const createHash = (value) => {
  let hash = 0

  for (const character of value) {
    hash = (hash * 31 + (character.codePointAt(0) ?? 0)) >>> 0
  }

  return hash.toString(36)
}

const getFeedbackId = (scope, type, text) => {
  if (!text) {
    return
  }

  return `reloadedflux-${scope}-${type}-${createHash(text)}`
}

const withFeedbackId = (scope, type, payload, getText) => {
  if (typeof payload === "string" || typeof payload === "number") {
    const text = getStableText(payload)
    const id = getFeedbackId(scope, type, text)
    return [{ id, content: payload }, id]
  }

  if (!payload || typeof payload !== "object" || payload.id) {
    return [payload, payload?.id]
  }

  const text = getText(payload)
  const id = getFeedbackId(scope, type, text)

  if (!id) {
    return [payload, undefined]
  }

  return [{ ...payload, id }, id]
}

const createMessageMethod = (type) => (payload) => {
  const [nextPayload] = withFeedbackId("message", type, payload, ({ content }) =>
    getStableText(content),
  )

  return ArcoMessage[type](nextPayload)
}

const createNotificationMethod = (type) => (payload) => {
  const [nextPayload] = withFeedbackId("notification", type, payload, ({ title, content }) =>
    [getStableText(title), getStableText(content)].filter(Boolean).join("|"),
  )

  return ArcoNotification[type](nextPayload)
}

export const Message = {
  clear: (...arguments_) => ArcoMessage.clear(...arguments_),
  error: createMessageMethod("error"),
  info: createMessageMethod("info"),
  loading: createMessageMethod("loading"),
  normal: createMessageMethod("normal"),
  success: createMessageMethod("success"),
  warning: createMessageMethod("warning"),
}

export const Notification = {
  clear: (...arguments_) => ArcoNotification.clear(...arguments_),
  error: createNotificationMethod("error"),
  info: createNotificationMethod("info"),
  normal: createNotificationMethod("normal"),
  remove: (...arguments_) => ArcoNotification.remove(...arguments_),
  success: createNotificationMethod("success"),
  warning: createNotificationMethod("warning"),
}
