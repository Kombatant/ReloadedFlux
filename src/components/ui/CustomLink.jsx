import { forwardRef } from "react"
import { Link } from "react-router"

import "./controls.css"

const CustomLink = forwardRef(
  (
    {
      url,
      text,
      onMouseEnter = (e) => e.target.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true })),
      onMouseLeave = (e) => e.target.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true })),
    },
    ref,
  ) => {
    return (
      <Link
        ref={ref}
        className="app-link"
        to={url}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {text}
      </Link>
    )
  },
)

CustomLink.displayName = "CustomLink"

export default CustomLink
