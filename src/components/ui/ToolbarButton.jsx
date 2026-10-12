import { Button } from "@arco-design/web-react"
import { IconDown } from "@arco-design/web-react/icon"
import classNames from "classnames"
import { forwardRef } from "react"

import CustomTooltip from "./CustomTooltip"

import "./controls.css"

/**
 * Ghost toolbar button: icon, optional label and an optional caret for menu
 * triggers. The label is always the accessible name, so it survives both
 * `iconOnly` and the toolbar's compact mode hiding it. Like IconButton, the
 * ref lands on the outermost element.
 */
const ToolbarButton = forwardRef(
  (
    {
      icon,
      label,
      tooltip,
      caret = false,
      iconOnly = false,
      active = false,
      open = false,
      className,
      ...rest
    },
    ref,
  ) => {
    const button = (
      <Button
        ref={tooltip ? undefined : ref}
        aria-label={label}
        type="text"
        className={classNames(
          "app-toolbar-button",
          {
            "app-toolbar-button--icon-only": iconOnly,
            "is-active": active,
            "is-open": open,
          },
          className,
        )}
        {...rest}
      >
        {icon}
        {iconOnly ? null : <span className="app-toolbar-button-label">{label}</span>}
        {caret ? <IconDown aria-hidden="true" className="app-toolbar-button-caret" /> : null}
      </Button>
    )

    if (!tooltip) {
      return button
    }

    return (
      <CustomTooltip ref={ref} mini content={tooltip}>
        {button}
      </CustomTooltip>
    )
  },
)

ToolbarButton.displayName = "ToolbarButton"

export default ToolbarButton
