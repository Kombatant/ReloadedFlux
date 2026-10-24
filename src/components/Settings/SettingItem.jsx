import { Typography } from "@arco-design/web-react"
import classNames from "classnames"

import "./SettingItem.css"

const SettingItem = ({
  children,
  description,
  disabled = false,
  disabledLabel,
  disabledReason,
  nested = false,
  title,
}) => (
  <section
    aria-disabled={disabled}
    className={classNames("setting-row", {
      "setting-row-disabled": disabled,
      "setting-row-nested": nested,
    })}
  >
    <header>
      <div className="setting-row-title">
        <Typography.Title className="setting-row-heading" heading={6}>
          {title}
        </Typography.Title>
        {disabled && disabledLabel ? (
          <span className="setting-row-status">{disabledLabel}</span>
        ) : null}
      </div>
      {description ? <Typography.Text type="secondary">{description}</Typography.Text> : null}
      {disabled && disabledReason ? (
        <Typography.Text className="setting-row-disabled-reason" type="secondary">
          {disabledReason}
        </Typography.Text>
      ) : null}
    </header>
    {children}
  </section>
)

export default SettingItem
