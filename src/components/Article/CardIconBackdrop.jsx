import FeedIcon from "@/components/ui/FeedIcon"

import "./CardIconBackdrop.css"

// The feed icon, enlarged and softly blurred, bleeding off the card's top-left
// corner and fading out along the diagonal, over a wider, heavily blurred copy
// that washes the icon's own colours outwards. Purely decorative. The card sizes
// it through the --icon-backdrop-* properties (see CardIconBackdrop.css).
const CardIconBackdrop = ({ feed }) => (
  <span aria-hidden="true" className="card-icon-backdrop">
    <FeedIcon className="card-icon-backdrop-glow" feed={feed} />
    <FeedIcon className="card-icon-backdrop-image" feed={feed} />
  </span>
)

export default CardIconBackdrop
