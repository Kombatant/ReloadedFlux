import classNames from "classnames"
import { useId } from "react"

/**
 * A titled group of setting rows. Rows sit in one bordered box with hairlines
 * between them; `plain` drops the box for content that brings its own frame
 * (tables, tag lists).
 */
const SettingsSection = ({ children, note, plain = false, title }) => {
  const titleId = useId()

  return (
    <div aria-labelledby={title ? titleId : undefined} className="settings-section" role="group">
      {title || note ? (
        <header className="settings-section-header">
          {title ? (
            <h3 className="settings-section-title" id={titleId}>
              {title}
            </h3>
          ) : null}
          {note ? <span className="settings-section-note">{note}</span> : null}
        </header>
      ) : null}
      <div className={classNames("settings-section-body", { "is-plain": plain })}>{children}</div>
    </div>
  )
}

export default SettingsSection
