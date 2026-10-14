import FeedIcon from "@/components/ui/FeedIcon"

import "./CardIconBackdrop.css"

// The feed icon, enlarged, bleeding off the card's top-left corner and fading
// out along the diagonal. Purely decorative. Two styles:
// - "icon": lightly blurred, over a wider, heavily blurred copy that washes the
//   icon's own colours outwards.
// - "glow": larger and heavily blurred, so only its colours remain.
// The card sizes it through the --icon-backdrop-* properties (see the CSS).
const CardIconBackdrop = ({ feed, variant = "icon" }) => (
  <span aria-hidden="true" className={`card-icon-backdrop card-icon-backdrop-${variant}`}>
    {variant === "icon" && <FeedIcon className="card-icon-backdrop-wash" feed={feed} />}
    <FeedIcon className="card-icon-backdrop-image" feed={feed} />
  </span>
)

export default CardIconBackdrop
