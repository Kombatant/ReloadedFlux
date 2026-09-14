/**
 * Shared shell for social post cards.
 *
 * Both the natively-rendered tweet and the Instagram link card use this so they
 * read as one component: same frame, same header layout, same footer rhythm.
 * Rendered as an <a> when the whole card is a link (Instagram, which exposes no
 * CORS-enabled content API), or a <div> when the body carries its own links.
 */

import "./SocialCard.css"

const SocialCard = ({ avatar, body, footer, href, isLink = false, name, platformId, subtitle }) => {
  const header = (
    <>
      {avatar ? (
        <img alt="" className="social-card-avatar" loading="lazy" src={avatar} />
      ) : (
        <span aria-hidden="true" className={`social-card-glyph social-card-glyph-${platformId}`} />
      )}
      <span className="social-card-identity">
        <span className="social-card-name">{name}</span>
        {subtitle ? <span className="social-card-subtitle">{subtitle}</span> : null}
      </span>
      <span aria-hidden="true" className={`social-card-logo social-card-logo-${platformId}`} />
    </>
  )

  const content = (
    <>
      {isLink ? (
        <span className="social-card-header">{header}</span>
      ) : (
        <a
          className="social-card-header"
          href={href}
          rel="noopener noreferrer"
          target="_blank"
          onClick={(event) => event.stopPropagation()}
        >
          {header}
        </a>
      )}
      {body ? <div className="social-card-body">{body}</div> : null}
      {footer ? <div className="social-card-footer">{footer}</div> : null}
    </>
  )

  if (isLink) {
    return (
      <a
        className="social-card social-card-clickable"
        href={href}
        rel="noopener noreferrer"
        target="_blank"
        onClick={(event) => event.stopPropagation()}
      >
        {content}
      </a>
    )
  }

  return <div className="social-card">{content}</div>
}

export default SocialCard
