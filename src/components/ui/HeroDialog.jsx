import { IconLaunch } from "@arco-design/web-react/icon"
import classNames from "classnames"

import "./HeroDialog.css"

/**
 * Building blocks for the app's "hero" dialogs (About, Update available):
 * a tinted banner with a logo tile, an optional grid of links, and a list of
 * label/value details. The Modal itself takes `className="hero-dialog"`.
 */
export const HeroDialogHeader = ({ logo, logoVariant = "brand", kicker, title, description }) => (
  <div className="hero-dialog-header">
    <div aria-hidden="true" className={`hero-dialog-logo hero-dialog-logo--${logoVariant}`}>
      {logo}
    </div>
    <div className="hero-dialog-heading">
      {kicker ? <div className="hero-dialog-kicker">{kicker}</div> : null}
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  </div>
)

export const HeroDialogLinks = ({ links }) => (
  <div className="hero-dialog-links">
    {links.map((link) => (
      <a
        key={link.href}
        className={classNames("hero-dialog-link", { "hero-dialog-link--wide": link.wide })}
        href={link.href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {link.icon}
        {link.label}
        {link.external ? <IconLaunch className="hero-dialog-link-external" /> : null}
      </a>
    ))}
  </div>
)

export const HeroDialogDetails = ({ label, items }) => (
  <div aria-label={label} className="hero-dialog-details">
    {items.map((item) => (
      <div
        key={item.label}
        className={classNames("hero-dialog-detail", {
          "hero-dialog-detail--highlight": item.highlight,
        })}
      >
        {item.icon}
        <span>{item.label}</span>
        <strong>{item.value}</strong>
      </div>
    ))}
  </div>
)
