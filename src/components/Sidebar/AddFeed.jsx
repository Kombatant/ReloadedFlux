import { IconPlus } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"

import IconButton from "@/components/ui/IconButton"
import { polyglotState } from "@/hooks/useLanguage"
import useModalToggle from "@/hooks/useModalToggle"

export default function AddFeed() {
  const { setAddFeedModalVisible } = useModalToggle()
  const { polyglot } = useStore(polyglotState)

  return (
    <IconButton
      icon={<IconPlus />}
      label={polyglot.t("sidebar.add_feed")}
      size="sm"
      onClick={() => setAddFeedModalVisible(true)}
    />
  )
}
