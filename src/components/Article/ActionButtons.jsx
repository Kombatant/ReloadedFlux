import { Dropdown, Menu } from "@arco-design/web-react"
import {
  IconArrowLeft,
  IconArrowRight,
  IconClose,
  IconCloudDownload,
  IconLaunch,
  IconMessage,
  IconMinusCircle,
  IconMoreVertical,
  IconRecord,
  IconSave,
  IconShareExternal,
  IconStar,
  IconStarFill,
} from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { memo, useState } from "react"

import AiSpark from "@/components/icons/AiSpark"
import { AppMenu, AppMenuItemContent } from "@/components/ui/AppMenu"
import IconButton from "@/components/ui/IconButton"
import useClassicKeyHandlers from "@/hooks/useClassicKeyHandlers"
import useEntryActions from "@/hooks/useEntryActions"
import useFetchOriginalTooltip from "@/hooks/useFetchOriginalTooltip"
import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import {
  articleHeadingsState,
  contentState,
  fetchingContentIdsState,
  nextContentState,
  prevContentState,
  summarizingContentIdsState,
} from "@/store/contentState"
import { dataState } from "@/store/dataState"
import { hotkeysState } from "@/store/hotkeysState"
import { settingsState } from "@/store/settingsState"
import { withHotkey } from "@/utils/hotkey-label"

import ArticleActionBar from "./ArticleActionBar"
import ArticleNavGroup from "./ArticleNavGroup"
import ArticleTOC from "./ArticleTOC"
import "./ActionButtons.css"

const MobileButtons = memo(({ commonButtons, hasHeadings }) => (
  <div className="mobile-buttons">
    {commonButtons.status}
    {commonButtons.star}
    {commonButtons.prev}
    {commonButtons.close}
    {commonButtons.next}
    {!hasHeadings && commonButtons.fetch}
    {commonButtons.summary}
    {commonButtons.toc}
    {commonButtons.more}
  </div>
))
MobileButtons.displayName = "MobileButtons"

/**
 * Reading pane controls. Desktop splits them: `placement="top"` is the pane's
 * top bar (close, prev/next, table of contents) and `placement="bottom"` the
 * labelled action bar shared with the Stream card. Mobile keeps one bottom
 * bar with large touch targets.
 */
const ActionButtons = ({ placement = "top" }) => {
  const { activeContent } = useStore(contentState)
  const { hasIntegrations } = useStore(dataState)
  const { polyglot } = useStore(polyglotState)
  const headings = useStore(articleHeadingsState)
  const fetchingContentIds = useStore(fetchingContentIdsState)
  const summarizingContentIds = useStore(summarizingContentIdsState)
  const hotkeys = useStore(hotkeysState)

  const { aiProvider, enableSwipeGesture } = useStore(settingsState)

  const nextContent = useStore(nextContentState)
  const prevContent = useStore(prevContentState)

  const [dropdownVisible, setDropdownVisible] = useState(false)
  // Keyed by entry id so a fetch that resolves after navigating away can't
  // disable the button on the article now shown
  const [fetchedOriginalId, setFetchedOriginalId] = useState(null)
  const [lastActiveContentId, setLastActiveContentId] = useState(activeContent?.id)

  if (activeContent?.id !== lastActiveContentId) {
    setLastActiveContentId(activeContent?.id)
    setFetchedOriginalId(null)
  }

  const hasHeadings = headings.length > 0
  const isFetchingOriginal = fetchingContentIds.has(activeContent.id)
  const isFetchedOriginal = fetchedOriginalId === activeContent.id
  const isSummarizing = summarizingContentIds.has(activeContent.id)

  const {
    handleFetchContent,
    handleSummarizeContent,
    handleSaveToThirdPartyServices,
    handleToggleStarred,
    handleToggleStatus,
    handleOpenLinkExternally,
  } = useEntryActions()

  const { exitDetailView, navigateToNextArticle, navigateToPreviousArticle } =
    useClassicKeyHandlers()

  const { isBelowMedium } = useScreenWidth()
  const fetchOriginalTooltip = useFetchOriginalTooltip()

  const isUnread = activeContent.status === "unread"
  const isStarred = activeContent.starred
  const hasAiSummary = activeContent?.content?.includes("ai-summary")
  const isSummaryDisabled = aiProvider === "none" || hasAiSummary

  const handleShare = async () => {
    if (!navigator.share) {
      console.error("Web Share API is not supported")
      return
    }

    const shareData = {
      title: activeContent.title,
      url: activeContent.url,
    }

    if (navigator.canShare && !navigator.canShare(shareData)) {
      console.error("This content cannot be shared")
      return
    }

    try {
      await navigator.share(shareData)
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error sharing article:", error)
      }
    }
  }

  const handleViewComments = () => window.open(activeContent.comments_url, "_blank")

  // Only a successful fetch disables the button, so a failed one can be retried
  const handleFetchOriginal = async () => {
    const entryId = activeContent.id
    const updatedEntry = await handleFetchContent(activeContent)
    if (updatedEntry) {
      setFetchedOriginalId(entryId)
    }
  }

  const commonButtons = {
    prev:
      isBelowMedium && enableSwipeGesture ? undefined : (
        <IconButton
          disabled={!prevContent}
          icon={<IconArrowLeft />}
          label={polyglot.t("article_card.previous_tooltip")}
          onClick={navigateToPreviousArticle}
        />
      ),
    next:
      isBelowMedium && enableSwipeGesture ? undefined : (
        <IconButton
          disabled={!nextContent}
          icon={<IconArrowRight />}
          label={polyglot.t("article_card.next_tooltip")}
          onClick={navigateToNextArticle}
        />
      ),
    status: (
      <IconButton
        icon={isUnread ? <IconMinusCircle /> : <IconRecord />}
        label={
          isUnread
            ? polyglot.t("article_card.mark_as_read_tooltip")
            : polyglot.t("article_card.mark_as_unread_tooltip")
        }
        onClick={() => handleToggleStatus(activeContent)}
      />
    ),
    star: (
      <IconButton
        icon={isStarred ? <IconStarFill /> : <IconStar />}
        starred={isStarred}
        label={
          isStarred
            ? polyglot.t("article_card.unstar_tooltip")
            : polyglot.t("article_card.star_tooltip")
        }
        onClick={() => handleToggleStarred(activeContent)}
      />
    ),
    close: (
      <IconButton
        icon={<IconClose />}
        label={polyglot.t("article_card.close_tooltip")}
        onClick={() => exitDetailView()}
      />
    ),
    fetch: (
      <IconButton
        disabled={isFetchedOriginal}
        icon={<IconCloudDownload />}
        label={fetchOriginalTooltip}
        loading={isFetchingOriginal}
        onClick={handleFetchOriginal}
      />
    ),
    summary: (
      <IconButton
        disabled={isSummaryDisabled}
        icon={<AiSpark />}
        label={polyglot.t("article_card.summarize_tooltip")}
        loading={isSummarizing}
        onClick={() => handleSummarizeContent()}
      />
    ),
    toc: hasHeadings ? <ArticleTOC /> : null,
    more: (
      <Dropdown
        popupVisible={dropdownVisible}
        position="br"
        trigger="click"
        droplist={
          <AppMenu>
            {hasIntegrations && isBelowMedium && (
              <Menu.Item
                key="save_to_third_party_services"
                onClick={() => handleSaveToThirdPartyServices(activeContent)}
              >
                <AppMenuItemContent icon={<IconSave />}>
                  {polyglot.t("article_card.save_to_third_party_services_tooltip")}
                </AppMenuItemContent>
              </Menu.Item>
            )}

            {isBelowMedium && hasHeadings && (
              <Menu.Item
                key="fetch_original"
                disabled={isFetchedOriginal || isFetchingOriginal}
                onClick={handleFetchOriginal}
              >
                <AppMenuItemContent icon={<IconCloudDownload />}>
                  {fetchOriginalTooltip}
                </AppMenuItemContent>
              </Menu.Item>
            )}

            {navigator.share && (
              <Menu.Item key="share" onClick={handleShare}>
                <AppMenuItemContent icon={<IconShareExternal />}>
                  {polyglot.t("article_card.share_tooltip")}
                </AppMenuItemContent>
              </Menu.Item>
            )}

            {activeContent.comments_url !== "" && (
              <Menu.Item key="view-comments" onClick={handleViewComments}>
                <AppMenuItemContent icon={<IconMessage />}>
                  {polyglot.t("article_card.view_comments_tooltip")}
                </AppMenuItemContent>
              </Menu.Item>
            )}

            {/* Desktop shows Open original as a labelled action-bar button. */}
            {isBelowMedium && (
              <Menu.Item
                key="open-in-browser"
                onClick={() => handleOpenLinkExternally(activeContent)}
              >
                <AppMenuItemContent icon={<IconLaunch />}>
                  {polyglot.t("article_card.open_link_externally_tooltip")}
                </AppMenuItemContent>
              </Menu.Item>
            )}
          </AppMenu>
        }
        onVisibleChange={setDropdownVisible}
      >
        <IconButton
          icon={<IconMoreVertical />}
          label={polyglot.t("article_card.more_actions_tooltip")}
          open={dropdownVisible}
        />
      </Dropdown>
    ),
  }

  if (isBelowMedium) {
    return (
      <div className="action-buttons mobile">
        <MobileButtons commonButtons={commonButtons} hasHeadings={hasHeadings} />
      </div>
    )
  }

  if (placement === "top") {
    const closeLabel = polyglot.t("article_card.close_tooltip")

    return (
      <div className="action-buttons reading-pane-topbar">
        <div className="left-side">
          <IconButton
            icon={<IconClose />}
            label={closeLabel}
            tooltip={withHotkey(closeLabel, hotkeys.exitDetailView)}
            onClick={() => exitDetailView()}
          />
          <span aria-hidden="true" className="reading-pane-nav-divider" />
          <ArticleNavGroup onNext={navigateToNextArticle} onPrevious={navigateToPreviousArticle} />
        </div>
        <div className="right-side">{commonButtons.toc}</div>
      </div>
    )
  }

  const hasMoreActions = Boolean(navigator.share) || activeContent.comments_url !== ""

  const leadingActions = [
    {
      key: "status",
      icon: isUnread ? <IconMinusCircle /> : <IconRecord />,
      label: polyglot.t(
        isUnread ? "article_card.mark_as_read_tooltip" : "article_card.mark_as_unread_tooltip",
      ),
      hint: hotkeys.toggleReadStatus,
      onClick: () => handleToggleStatus(activeContent),
    },
    {
      key: "star",
      icon: isStarred ? <IconStarFill /> : <IconStar />,
      label: polyglot.t(isStarred ? "article_card.unstar_tooltip" : "article_card.star_tooltip"),
      hint: hotkeys.toggleStarStatus,
      starred: isStarred,
      onClick: () => handleToggleStarred(activeContent),
    },
    {
      key: "summarize",
      icon: <AiSpark />,
      label: polyglot.t("article_card.summarize_label"),
      tooltip: polyglot.t("article_card.summarize_tooltip"),
      hint: hotkeys.summarizeContent,
      disabled: isSummaryDisabled,
      loading: isSummarizing,
      onClick: () => handleSummarizeContent(),
    },
    {
      key: "fetch",
      icon: <IconCloudDownload />,
      label: polyglot.t("article_card.fetch_original_label"),
      tooltip: fetchOriginalTooltip,
      hint: hotkeys.fetchOriginalArticle,
      disabled: isFetchedOriginal,
      loading: isFetchingOriginal,
      onClick: handleFetchOriginal,
    },
    hasIntegrations
      ? {
          key: "save",
          icon: <IconSave />,
          label: polyglot.t("article_card.save_label"),
          tooltip: polyglot.t("article_card.save_to_third_party_services_tooltip"),
          hint: hotkeys.saveToThirdPartyServices,
          onClick: () => handleSaveToThirdPartyServices(activeContent),
        }
      : null,
  ].filter(Boolean)

  const trailingActions = [
    hasMoreActions ? { key: "more", element: commonButtons.more } : null,
    {
      key: "open",
      icon: <IconLaunch />,
      label: polyglot.t("article_card.open_original_label"),
      tooltip: polyglot.t("article_card.open_link_externally_tooltip"),
      hint: hotkeys.openLinkExternally,
      onClick: () => handleOpenLinkExternally(activeContent),
    },
  ].filter(Boolean)

  return (
    <ArticleActionBar
      className="reading-pane-action-bar"
      leading={leadingActions}
      trailing={trailingActions}
    />
  )
}

export default ActionButtons
