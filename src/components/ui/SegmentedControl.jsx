import classNames from "classnames"
import { useRef } from "react"

import CustomTooltip from "./CustomTooltip"

import "./controls.css"

const ARROW_STEPS = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }

/**
 * Mutually exclusive options in one track; the selected segment is raised.
 *
 * Segments share equal grid columns, so the widest label sets every segment's
 * width in each locale. It behaves as a radio group: one tab stop, arrow keys
 * move the selection.
 */
const SegmentedControl = ({ ariaLabel, options, value, onChange, iconOnly = false, className }) => {
  const segmentRefs = useRef([])
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )

  const handleKeyDown = (event) => {
    const step = ARROW_STEPS[event.key]
    if (!step) {
      return
    }

    event.preventDefault()
    const nextIndex = (selectedIndex + step + options.length) % options.length
    segmentRefs.current[nextIndex]?.focus()
    onChange(options[nextIndex].value)
  }

  return (
    <div
      aria-label={ariaLabel}
      className={classNames("app-segmented", { "app-segmented--icon-only": iconOnly }, className)}
      role="radiogroup"
      onKeyDown={handleKeyDown}
    >
      {options.map((option, index) => {
        const isSelected = index === selectedIndex
        const segment = (
          <button
            ref={(node) => {
              segmentRefs.current[index] = node
            }}
            aria-checked={isSelected}
            aria-label={option.label}
            className={classNames("app-segment", { "is-selected": isSelected })}
            role="radio"
            tabIndex={isSelected ? 0 : -1}
            type="button"
            onClick={() => {
              if (!isSelected) {
                onChange(option.value)
              }
            }}
          >
            {option.icon}
            {iconOnly ? null : <span className="app-segment-label">{option.label}</span>}
          </button>
        )

        const tooltip = option.tooltip ?? (iconOnly ? option.label : null)

        return tooltip ? (
          <CustomTooltip key={option.value} mini content={tooltip}>
            {segment}
          </CustomTooltip>
        ) : (
          <span key={option.value}>{segment}</span>
        )
      })}
    </div>
  )
}

export default SegmentedControl
