const HOTKEY_PART_LABELS = {
  alt: "Alt",
  ctrl: "Ctrl",
  down: "↓",
  esc: "Esc",
  left: "←",
  meta: "⌘",
  right: "→",
  shift: "⇧",
  up: "↑",
}

// First binding of a hotkey action, e.g. ["shift+n"] -> "⇧+N".
const formatHotkey = (keys) => {
  const [firstBinding] = keys ?? []
  if (!firstBinding) {
    return null
  }
  return firstBinding
    .split("+")
    .map((part) => HOTKEY_PART_LABELS[part] ?? part.toUpperCase())
    .join("+")
}

// "Next article · N": an action's name followed by its first shortcut.
export const withHotkey = (label, keys) => {
  const hotkey = formatHotkey(keys)
  return hotkey ? `${label} · ${hotkey}` : label
}

export default formatHotkey
