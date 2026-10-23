import { IconLoading } from "@arco-design/web-react/icon"
import classNames from "classnames"
import { Fragment, useLayoutEffect, useRef, useState } from "react"

import IconButton from "@/components/ui/IconButton"
import ToolbarButton from "@/components/ui/ToolbarButton"
import formatHotkey from "@/utils/hotkey-label"

import "./ArticleActionBar.css"

// Bar widths (px) below which the bar sheds detail: first the key hints,
// then the leading labels. Tuned for English with every action present.
const FULL_MIN_WIDTH = 1040
const LABELS_MIN_WIDTH = 880

const getDensity = (width) => {
  if (width >= FULL_MIN_WIDTH) {
    return "full"
  }
  return width >= LABELS_MIN_WIDTH ? "labels" : "compact"
}

const renderAction = (action, { iconOnly, showHint }) => {
  // Escape hatch for controls that own their trigger, like a Dropdown.
  if (action.element) {
    return <Fragment key={action.key}>{action.element}</Fragment>
  }

  const { key, className, disabled, hint, icon, label, loading, onClick, starred, tooltip } = action

  if (iconOnly) {
    return (
      <IconButton
        key={key}
        className={className}
        disabled={disabled}
        icon={icon}
        label={label}
        loading={loading}
        starred={starred}
        tooltip={tooltip ?? label}
        onClick={onClick}
      />
    )
  }

  // ToolbarButton renders its icon as a child, so Arco's own `loading` would
  // add a second icon; swap in the spinner and block clicks instead.
  return (
    <ToolbarButton
      key={key}
      disabled={disabled || loading}
      hint={showHint ? formatHotkey(hint) : null}
      icon={loading ? <IconLoading /> : icon}
      label={label}
      tooltip={tooltip}
      className={classNames(className, {
        "is-loading": loading,
        "is-starred": starred,
      })}
      onClick={onClick}
    />
  )
}

/**
 * The labelled action bar under an article: the Stream card's footer and the
 * Classic reading pane's bottom bar. `leading` actions sit left, `trailing`
 * ones right. Each action is a ToolbarButton spec (`hint` takes the hotkey
 * binding list) or `{ key, element }` for a custom control.
 *
 * The bar watches its own width: narrow bars drop the key hints, then turn the
 * leading actions icon-only (label moves to the tooltip). Trailing actions
 * keep their labels.
 */
const ArticleActionBar = ({ className, hideHints = false, leading, trailing }) => {
  const barRef = useRef(null)
  const [density, setDensity] = useState("full")

  // Layout effect so the first paint already has the right density.
  useLayoutEffect(() => {
    const bar = barRef.current
    if (!bar) {
      return
    }

    const update = () => setDensity(getDensity(bar.clientWidth))
    update()

    if (typeof ResizeObserver !== "function") {
      return
    }
    const observer = new ResizeObserver(update)
    observer.observe(bar)
    return () => observer.disconnect()
  }, [])

  const showHint = density === "full" && !hideHints
  const leadingOptions = { iconOnly: density === "compact", showHint }
  const trailingOptions = { iconOnly: false, showHint }

  return (
    <footer ref={barRef} className={classNames("article-action-bar", className)}>
      {leading.map((action) => renderAction(action, leadingOptions))}
      <span aria-hidden="true" className="article-action-bar-spacer" />
      {trailing.map((action) => renderAction(action, trailingOptions))}
    </footer>
  )
}

export default ArticleActionBar
