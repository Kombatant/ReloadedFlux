import { Button, Tag, Typography } from "@arco-design/web-react"
import {
  IconCloudDownload,
  IconLaunch,
  IconMinusCircle,
  IconRecord,
  IconSave,
  IconStar,
  IconStarFill,
} from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { memo, useMemo, useState } from "react"
import { useNavigate } from "react-router"

import ArticleBodyRenderer from "./ArticleBodyRenderer"

import AiSpark from "@/components/icons/AiSpark"
import CustomTooltip from "@/components/ui/CustomTooltip"
import FeedIcon from "@/components/ui/FeedIcon"
import useEntryActions from "@/hooks/useEntryActions"
import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import { dataState } from "@/store/dataState"
import { settingsState } from "@/store/settingsState"
import { generateReadableDate, generateReadingTime, generateRelativeTime } from "@/utils/date"

import "./StreamArticleCard.css"

const isInteractiveTarget = (target) =>
  target.closest("a, button, input, textarea, select, [role='button']")

const withStopPropagation = (callback) => (event) => {
  event.stopPropagation()
  callback()
}

const StreamArticleCard = ({ activeEntry, entry, handleEntryClick, isSelected }) => {
  const navigate = useNavigate()
  const { hasIntegrations } = useStore(dataState)
  const {
    aiProvider,
    articleWidth,
    showDetailedRelativeTime,
    showEstimatedReadingTime,
    showFeedIcon,
    streamRenderSelectedOnly,
    titleAlignment,
  } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)
  const { isBelowMedium } = useScreenWidth()

  const {
    handleFetchContent,
    handleOpenLinkExternally,
    handleSaveToThirdPartyServices,
    handleSummarizeContent,
    handleToggleStarred,
    handleToggleStatus,
  } = useEntryActions()

  const currentEntry = activeEntry ?? entry
  const isUnread = currentEntry.status === "unread"
  const isStarred = currentEntry.starred
  const hasAiSummary = currentEntry.content?.includes("ai-summary")

  const [fetchingEntryId, setFetchingEntryId] = useState(null)
  const [summarizingEntryId, setSummarizingEntryId] = useState(null)
  const isFetchingOriginal = fetchingEntryId === currentEntry.id
  const isSummarizing = summarizingEntryId === currentEntry.id
  const contentMaxWidth = isBelowMedium ? "100%" : `${articleWidth}%`
  const previewText = useMemo(() => currentEntry.previewText || "", [currentEntry.previewText])

  const selectEntry = () => {
    if (!isSelected) {
      handleEntryClick(entry)
    }
  }

  const handleCardClick = (event) => {
    if (isInteractiveTarget(event.target)) {
      return
    }

    selectEntry()
  }

  return (
    <article
      data-entry-id={entry.id}
      tabIndex={0}
      className={
        isSelected ? "card-wrapper stream-story-card selected" : "card-wrapper stream-story-card"
      }
      onClick={handleCardClick}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && !isInteractiveTarget(event.target)) {
          event.preventDefault()
          selectEntry()
        }
      }}
    >
      <div className="stream-story-topline">
        <div className="stream-story-source">
          {showFeedIcon && <FeedIcon className="feed-icon-mini" feed={currentEntry.feed} />}
          <span className="stream-story-source-title">{currentEntry.feed.title}</span>
          {currentEntry.author ? (
            <span className="stream-story-author">{currentEntry.author}</span>
          ) : null}
        </div>
        <div className="stream-story-actions">
          <span className="stream-story-time">
            {generateRelativeTime(currentEntry.published_at, showDetailedRelativeTime)}
          </span>
          <CustomTooltip
            mini
            content={
              isUnread
                ? polyglot.t("article_card.mark_as_read_tooltip")
                : polyglot.t("article_card.mark_as_unread_tooltip")
            }
          >
            <Button
              icon={isUnread ? <IconMinusCircle /> : <IconRecord />}
              shape="circle"
              size="small"
              onClick={withStopPropagation(() => handleToggleStatus(currentEntry))}
            />
          </CustomTooltip>
          <CustomTooltip
            mini
            content={
              isStarred
                ? polyglot.t("article_card.unstar_tooltip")
                : polyglot.t("article_card.star_tooltip")
            }
          >
            <Button
              icon={isStarred ? <IconStarFill style={{ color: "#ffcd00" }} /> : <IconStar />}
              shape="circle"
              size="small"
              onClick={withStopPropagation(() => handleToggleStarred(currentEntry))}
            />
          </CustomTooltip>
          <CustomTooltip mini content={polyglot.t("article_card.fetch_original_tooltip")}>
            <Button
              icon={<IconCloudDownload />}
              loading={isFetchingOriginal}
              shape="circle"
              size="small"
              onClick={withStopPropagation(async () => {
                setFetchingEntryId(currentEntry.id)
                await handleFetchContent(currentEntry)
                setFetchingEntryId(null)
              })}
            />
          </CustomTooltip>
          <CustomTooltip mini content={polyglot.t("article_card.summarize_tooltip")}>
            <Button
              disabled={aiProvider === "none" || hasAiSummary}
              icon={<AiSpark />}
              loading={isSummarizing}
              shape="circle"
              size="small"
              onClick={withStopPropagation(async () => {
                setSummarizingEntryId(currentEntry.id)
                await handleSummarizeContent(currentEntry)
                setSummarizingEntryId(null)
              })}
            />
          </CustomTooltip>
          {hasIntegrations ? (
            <CustomTooltip
              mini
              content={polyglot.t("article_card.save_to_third_party_services_tooltip")}
            >
              <Button
                icon={<IconSave />}
                shape="circle"
                size="small"
                onClick={withStopPropagation(() => handleSaveToThirdPartyServices(currentEntry))}
              />
            </CustomTooltip>
          ) : null}
          <CustomTooltip mini content={polyglot.t("article_card.open_link_externally_tooltip")}>
            <Button
              icon={<IconLaunch />}
              shape="circle"
              size="small"
              onClick={withStopPropagation(() => handleOpenLinkExternally(currentEntry))}
            />
          </CustomTooltip>
        </div>
      </div>

      <Typography.Title
        className={isUnread ? "stream-story-title" : "stream-story-title stream-story-title-read"}
        heading={4}
        style={{ maxWidth: contentMaxWidth, textAlign: titleAlignment }}
      >
        <button
          className="stream-story-title-link"
          type="button"
          onClick={withStopPropagation(() => handleOpenLinkExternally(currentEntry))}
        >
          {currentEntry.title}
        </button>
      </Typography.Title>
      <div className="stream-story-expanded">
        <div className="stream-story-meta" style={{ maxWidth: contentMaxWidth }}>
          <Tag
            className="stream-story-category"
            size="small"
            onClick={(event) => {
              event.stopPropagation()
              navigate(`/category/${currentEntry.feed.category.id}`)
            }}
          >
            {currentEntry.feed.category.title}
          </Tag>
          <span>{generateReadableDate(currentEntry.published_at)}</span>
          {showEstimatedReadingTime ? (
            <span>{generateReadingTime(currentEntry.reading_time)}</span>
          ) : null}
        </div>
        {isSelected || !streamRenderSelectedOnly ? (
          <ArticleBodyRenderer entry={currentEntry} maxWidth={contentMaxWidth} />
        ) : (
          <p className="stream-story-preview" style={{ maxWidth: contentMaxWidth }}>
            {previewText}
          </p>
        )}
      </div>
    </article>
  )
}

export default memo(StreamArticleCard)
