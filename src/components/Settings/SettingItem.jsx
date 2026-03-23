import { Typography } from "@arco-design/web-react"

import "./SettingItem.css"

const SettingItem = ({
  children,
  description,
  disabled = false,
  disabledLabel,
  disabledReason,
  title,
}) => (
  <section
    aria-disabled={disabled}
    className={disabled ? "setting-row setting-row-disabled" : "setting-row"}
  >
    <header>
      <div className="setting-row-title">
        <Typography.Title heading={6} style={{ marginTop: 0 }}>
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
