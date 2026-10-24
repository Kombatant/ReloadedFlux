import { useStore } from "@nanostores/react"
import { forwardRef, useEffect, useRef } from "react"
import SimpleBar from "simplebar-react"

import FadeTransition from "@/components/ui/FadeTransition"
import usePhotoSlider from "@/hooks/usePhotoSlider"
import { contentState } from "@/store/contentState"
import { settingsState } from "@/store/settingsState"

import ArticleReadingView from "./ArticleReadingView"
import "./ArticleDetail.css"

const ArticleDetail = forwardRef((_, ref) => {
  const { activeContent } = useStore(contentState)
  const { titleAlignment } = useStore(settingsState)
  const scrollContainerRef = useRef(null)

  const { isPhotoSliderVisible, setIsPhotoSliderVisible, selectedIndex, setSelectedIndex } =
    usePhotoSlider()

  // Focus the scrollable area when activeContent changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollElement = scrollContainerRef.current.getScrollElement()
      scrollElement?.focus()
    }
  }, [activeContent.id])

  return (
    <article
      ref={ref}
      tabIndex={-1}
      className={
        titleAlignment === "justify" ? "article-content article-text-justify" : "article-content"
      }
    >
      <SimpleBar
        ref={scrollContainerRef}
        className="scroll-container"
        scrollableNodeProps={{ tabIndex: -1 }}
      >
        <FadeTransition y={20}>
          <ArticleReadingView
            entry={activeContent}
            lightboxState={{
              isPhotoSliderVisible,
              selectedIndex,
              setIsPhotoSliderVisible,
              setSelectedIndex,
            }}
          />
        </FadeTransition>
      </SimpleBar>
    </article>
  )
})
ArticleDetail.displayName = "ArticleDetail"

export default ArticleDetail
