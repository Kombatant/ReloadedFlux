import { Typography } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { forwardRef, useEffect, useRef } from "react"
import SimpleBar from "simplebar-react"

import FadeTransition from "@/components/ui/FadeTransition"
import usePhotoSlider from "@/hooks/usePhotoSlider"
import useScreenWidth from "@/hooks/useScreenWidth"
import { contentState } from "@/store/contentState"
import { settingsState } from "@/store/settingsState"

import ArticleBodyRenderer from "./ArticleBodyRenderer"
import ArticleEyebrow from "./ArticleEyebrow"
import "./ArticleDetail.css"

const ArticleDetail = forwardRef((_, ref) => {
  const { isBelowMedium } = useScreenWidth()

  const { activeContent } = useStore(contentState)
  const { articleWidth, fontFamily, titleAlignment } = useStore(settingsState)
  const isCentered = titleAlignment === "center"
  const scrollContainerRef = useRef(null)

  const { isPhotoSliderVisible, setIsPhotoSliderVisible, selectedIndex, setSelectedIndex } =
    usePhotoSlider()

  const getResponsiveMaxWidth = () => {
    if (isBelowMedium) {
      return "90%"
    }
    return `min(${articleWidth}%, calc(100% - (var(--article-side-gutter) * 2)))`
  }

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
          <div
            className="article-header"
            style={{ maxWidth: getResponsiveMaxWidth(), textAlign: isCentered ? "center" : "left" }}
          >
            <ArticleEyebrow centered={isCentered} entry={activeContent} />
            <Typography.Title
              className="article-title"
              heading={3}
              style={{ fontFamily: fontFamily }}
            >
              <a href={activeContent.url} rel="noopener noreferrer" target="_blank">
                {activeContent.title}
              </a>
            </Typography.Title>
          </div>
          <ArticleBodyRenderer
            entry={activeContent}
            maxWidth={getResponsiveMaxWidth()}
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
