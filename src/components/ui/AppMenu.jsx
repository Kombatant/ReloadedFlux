import { Menu } from "@arco-design/web-react"
import { IconCheck } from "@arco-design/web-react/icon"
import classNames from "classnames"

import "./controls.css"

/** Dropdown menu with the shared skin. Accepts every Arco Menu prop. */
export const AppMenu = ({ className, ...props }) => (
  <Menu className={classNames("app-menu", className)} {...props} />
)

/**
 * Row content for an AppMenu item: icon first, then the label. `checked`
 * turns the icon slot into a check mark (radio-style sections); `danger`
 * paints destructive actions.
 */
export const AppMenuItemContent = ({ icon, checked, danger = false, children }) => {
  const isCheckable = checked !== undefined
  const slot = isCheckable ? checked ? <IconCheck /> : null : icon

  return (
    <span
      className={classNames("app-menu-item", {
        "is-checked": checked === true,
        "is-danger": danger,
      })}
    >
      {slot || isCheckable ? (
        <span aria-hidden="true" className="app-menu-item-icon">
          {slot}
        </span>
      ) : null}
      <span className="app-menu-item-label">{children}</span>
    </span>
  )
}

export const AppMenuDivider = () => <div className="app-menu-divider" role="separator" />
