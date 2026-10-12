import classNames from "classnames"

import "./controls.css"

/**
 * Text that acts: a real <button> styled as inline text (author filters,
 * feed names), so it is focusable and keyboard-operable.
 */
const InlineAction = ({ className, children, ...props }) => (
  <button className={classNames("app-inline-action", className)} type="button" {...props}>
    {children}
  </button>
)

export default InlineAction
