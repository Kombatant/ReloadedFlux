import classNames from "classnames"
import { useId } from "react"

import "./LayoutPicker.css"

/** Layout picker: two preview cards that act as a radio group. */
const LayoutPicker = ({ ariaLabel, className, options, value, onChange }) => {
  const name = useId()

  return (
    <div
      aria-label={ariaLabel}
      className={classNames("app-layout-picker", className)}
      role="radiogroup"
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={classNames("app-layout-option", { "is-disabled": option.disabled })}
        >
          <input
            checked={value === option.value}
            disabled={option.disabled}
            name={name}
            type="radio"
            value={option.value}
            onChange={() => onChange(option.value)}
          />
          <span className="app-layout-card">
            <span
              aria-hidden="true"
              className={`app-layout-preview app-layout-preview-${option.value}`}
            >
              <span />
              <span />
              <span />
            </span>
            <span>{option.label}</span>
          </span>
        </label>
      ))}
    </div>
  )
}

export default LayoutPicker
