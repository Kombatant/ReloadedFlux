import { Button, Typography } from "@arco-design/web-react"
import { IconEmpty } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { throttle } from "lodash-es"
import { useEffect, useMemo } from "react"
import SimpleBar from "simplebar-react"

import LoadingCards from "@/components/Article/LoadingCards"
import SearchAndSortBar from "@/components/Article/SearchAndSortBar"
import StreamArticleCard from "@/components/Article/StreamArticleCard"
import useLoadMore from "@/hooks/useLoadMore"
import { contentState, filteredEntriesState } from "@/store/contentState"

import "./StoryStream.css"

const StoryStream = ({
  cardsRef,
  entryListRef,
  getEntries,
  handleEntryClick,
  info,
  markAllAsRead,
  refreshArticleList,
}) => {
  const { isArticleListReady, loadMoreVisible } = useStore(contentState)
  const filteredEntries = useStore(filteredEntriesState)
  const { loadingMore, handleLoadMore } = useLoadMore()
  const canLoadMore = loadMoreVisible && isArticleListReady && !loadingMore

  const checkAndLoadMore = useMemo(
    () =>
      throttle((element) => {
        if (!canLoadMore) {
          return
        }

        const threshold = element.scrollHeight * 0.82
        const scrolledDistance = element.scrollTop + element.clientHeight
        if (scrolledDistance >= threshold) {
          handleLoadMore(getEntries)
        }
      }, 200),
    [canLoadMore, getEntries, handleLoadMore],
  )

  useEffect(() => {
    return () => checkAndLoadMore.cancel()
  }, [checkAndLoadMore])

  const hasEntries = filteredEntries.length > 0

  return (
    <div className="article-container story-stream-layout">
      <div className="story-stream-toolbar">
        <SearchAndSortBar
          info={info}
          markAllAsRead={markAllAsRead}
          refreshArticleList={refreshArticleList}
          variant="stream"
        />
      </div>
      <SimpleBar
        ref={entryListRef}
        className="entry-list story-stream-list"
        scrollableNodeProps={{
          ref: cardsRef,
          onScroll: (event) => checkAndLoadMore(event.currentTarget),
        }}
      >
        <LoadingCards />
        {isArticleListReady && !hasEntries ? (
          <div className="story-stream-empty">
            <IconEmpty style={{ fontSize: 44 }} />
            <Typography.Text>ReactFlux</Typography.Text>
          </div>
        ) : null}
        {filteredEntries.map((entry) => (
          <StreamArticleCard key={entry.id} entry={entry} handleEntryClick={handleEntryClick} />
        ))}
        {loadMoreVisible ? (
          <div className="load-more-container story-stream-load-more">
            <Button loading={loadingMore} type="text" onClick={() => handleLoadMore(getEntries)}>
              Loading more ...
            </Button>
          </div>
        ) : null}
      </SimpleBar>
    </div>
  )
}

export default StoryStream
