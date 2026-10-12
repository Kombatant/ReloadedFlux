import classNames from "classnames"

import "./controls.css"

/**
 * Centered empty / end-of-list state: an icon in a tinted circle, a title,
 * an optional description and actions. `tone` picks the circle colour.
 */
const EmptyState = ({ icon, tone = "neutral", title, description, actions, footer, className }) => (
  <div className={classNames("app-empty-state", className)}>
    {icon ? (
      <div aria-hidden="true" className={`app-empty-state-icon app-empty-state-icon--${tone}`}>
        {icon}
      </div>
    ) : null}
    {title ? <div className="app-empty-state-title">{title}</div> : null}
    {description ? <div className="app-empty-state-description">{description}</div> : null}
    {actions ? <div className="app-empty-state-actions">{actions}</div> : null}
    {footer}
  </div>
)

export default EmptyState
