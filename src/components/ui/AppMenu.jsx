import { Menu } from "@arco-design/web-react"
import { IconCheck } from "@arco-design/web-react/icon"
import classNames from "classnames"

import "./controls.css"

/** Dropdown menu with the shared skin. Accepts every Arco Menu prop. */
export const AppMenu = ({ className, ...props }) => (
  <Menu className={classNames("app-menu", className)} {...props} />
)

// Arco's Dropdown only renders its content as a dropdown menu (prefix, item
// click handling, styles) when it recognises Arco's Menu by this flag.
AppMenu.__ARCO_MENU__ = true

/**
 * Row content for an AppMenu item: icon first, then the label, so every row
 * lines up. In radio-style sections pass `checked`; the selected row turns
 * the accent colour and shows a check mark at the trailing edge. `danger`
 * paints destructive actions; `suffix` adds a trailing hint such as an
 * external-link icon.
 */
export const AppMenuItemContent = ({ icon, checked, danger = false, suffix, children }) => {
  const trailing = checked ? <IconCheck /> : suffix

  return (
    <span
      className={classNames("app-menu-item", {
        "is-checked": checked === true,
        "is-danger": danger,
      })}
    >
      {icon ? (
        <span aria-hidden="true" className="app-menu-item-icon">
          {icon}
        </span>
      ) : null}
      <span className="app-menu-item-label">{children}</span>
      {trailing ? (
        <span aria-hidden="true" className="app-menu-item-suffix">
          {trailing}
        </span>
      ) : null}
    </span>
  )
}

export const AppMenuDivider = () => <div className="app-menu-divider" role="separator" />
