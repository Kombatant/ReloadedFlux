import { useStore } from "@nanostores/react"

import useScreenWidth from "@/hooks/useScreenWidth"
import { settingsState } from "@/store/settingsState"

import ClassicContent from "./ClassicContent"
import StreamContent from "./StreamContent"


const Content = ({ info, getEntries, markAllAsRead }) => {
  const { layoutMode } = useStore(settingsState)
  const { isBelowMedium } = useScreenWidth()

  const shouldUseStoryStream = layoutMode === "stream" && !isBelowMedium

  if (shouldUseStoryStream) {
    return <StreamContent getEntries={getEntries} info={info} markAllAsRead={markAllAsRead} />
  }

  return <ClassicContent getEntries={getEntries} info={info} markAllAsRead={markAllAsRead} />
}

export default Content
