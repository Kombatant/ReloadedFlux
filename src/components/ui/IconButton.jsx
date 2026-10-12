import { Button } from "@arco-design/web-react"
import classNames from "classnames"
import { forwardRef } from "react"

import CustomTooltip from "./CustomTooltip"

import "./controls.css"

/**
 * The single icon-only action button: a borderless 32px rounded square (28px
 * with `size="sm"`), the same shape as ToolbarButton. `label` is both the
 * accessible name and, unless `tooltip` overrides it, the hover tooltip.
 *
 * The forwarded ref lands on the outermost element, so it works as the
 * trigger child of Dropdown, Popconfirm and DatePicker.
 */
const IconButton = forwardRef(
  (
    {
      icon,
      label,
      tooltip = label,
      active = false,
      starred = false,
      danger = false,
      open = false,
      size = "md",
      className,
      ...rest
    },
    ref,
  ) => {
    const button = (
      <Button
        ref={tooltip ? undefined : ref}
        aria-label={label}
        icon={icon}
        type="text"
        className={classNames(
          "app-icon-button",
          {
            "app-icon-button--sm": size === "sm",
            "is-active": active,
            "is-danger": danger,
            "is-open": open,
            "is-starred": starred,
          },
          className,
        )}
        {...rest}
      />
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

IconButton.displayName = "IconButton"

export default IconButton
