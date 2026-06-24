import { Card, Skeleton } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"

import { contentState } from "@/store/contentState"
import { settingsState } from "@/store/settingsState"
import "./LoadingCards.css"

const LoadingCard = ({ animationsEnabled, index, isArticleListReady }) => (
  <Card
    className={`card-style loading-card ${animationsEnabled ? "is-animated" : ""}`}
    cover={null}
    style={{ "--loading-card-delay": `${index * 90}ms` }}
  >
    <Card.Meta
      description={
        <Skeleton
          animation={animationsEnabled}
          loading={!isArticleListReady}
          text={{ rows: 3, width: ["100%", "100%", 150] }}
        />
      }
    />
  </Card>
)

const LoadingCards = () => {
  const { isArticleListReady } = useStore(contentState)
  const { animationsEnabled } = useStore(settingsState)

  return (
    !isArticleListReady &&
    Array.from({ length: 4 }, (_, index) => (
      <LoadingCard
        key={index}
        animationsEnabled={animationsEnabled}
        index={index}
        isArticleListReady={isArticleListReady}
      />
    ))
  )
}

export default LoadingCards
