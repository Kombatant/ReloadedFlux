import { Tooltip } from "@arco-design/web-react"
import { forwardRef, useState } from "react"

import useScreenWidth from "@/hooks/useScreenWidth"

const CustomTooltip = forwardRef(({ children, ...props }, ref) => {
  const { isBelowMedium } = useScreenWidth()
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Tooltip
      popupVisible={!isBelowMedium && isHovered}
      onVisibleChange={(visible) => setIsHovered(visible)}
      {...props}
    >
      <span ref={ref}>{children}</span>
    </Tooltip>
  )
})

CustomTooltip.displayName = "CustomTooltip"

export default CustomTooltip
