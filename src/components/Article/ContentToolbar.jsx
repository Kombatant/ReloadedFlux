import { Button, DatePicker, Dropdown, Menu, Typography } from "@arco-design/web-react"
import {
  IconAlignLeft,
  IconCalendar,
  IconRecord,
  IconSearch,
  IconSortAscending,
  IconSortDescending,
} from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import classNames from "classnames"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router"

import { AppMenu, AppMenuDivider, AppMenuItemContent } from "@/components/ui/AppMenu"
import IconButton from "@/components/ui/IconButton"
import SegmentedControl from "@/components/ui/SegmentedControl"
import ToolbarButton from "@/components/ui/ToolbarButton"
import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import useStreamKeyHandlers from "@/hooks/useStreamKeyHandlers"
import {
  contentState,
  dynamicCountState,
  setFilterDate,
  setFilterString,
} from "@/store/contentState"
import { categoriesState, feedsState } from "@/store/dataState"
import draftFilterTypeState from "@/store/searchBarState"
import { settingsState, updateSettings } from "@/store/settingsState"
import { getStartOfToday } from "@/utils/date"
import createSetter from "@/utils/nanostores"

import ArticleNavGroup from "./ArticleNavGroup"
import MarkReadControl from "./MarkReadControl"
import SearchForm from "./SearchForm"
import SidebarTrigger from "./SidebarTrigger"

import "./ContentToolbar.css"

const setDraftFilterType = createSetter(draftFilterTypeState)

const useToolbarTitle = () => {
  const { infoFrom } = useStore(contentState)
  const { polyglot } = useStore(polyglotState)
  const feeds = useStore(feedsState)
  const categories = useStore(categoriesState)
  const { id } = useParams()

  return useMemo(() => {
    if (id && infoFrom === "category") {
      return categories.find((c) => c.id === Number(id))?.title
    }
    if (id && infoFrom === "feed") {
      return feeds.find((f) => f.id === Number(id))?.title
    }

    const titleKeys = {
      all: "sidebar.all",
      today: "sidebar.today",
      starred: "sidebar.starred",
      history: "sidebar.history",
    }

    return titleKeys[infoFrom] ? polyglot.t(titleKeys[infoFrom]) : ""
  }, [infoFrom, id, categories, feeds, polyglot])
}

const getSortIcon = (orderDirection) =>
  orderDirection === "desc" ? <IconSortDescending /> : <IconSortAscending />

/** Unread / All, as a segmented control (Stream) or a View menu section (Classic). */
const useStatusOptions = () => {
  const { polyglot } = useStore(polyglotState)

  return [
    {
      value: "unread",
      label: polyglot.t("article_list.filter_status_unread"),
      icon: <IconRecord />,
    },
    {
      value: "all",
      label: polyglot.t("article_list.filter_status_all"),
      icon: <IconAlignLeft />,
    },
  ]
}

const useSortOptions = () => {
  const { polyglot } = useStore(polyglotState)

  return [
    {
      value: "desc",
      label: polyglot.t("article_list.sort_direction_desc"),
      icon: <IconSortDescending />,
    },
    {
      value: "asc",
      label: polyglot.t("article_list.sort_direction_asc"),
      icon: <IconSortAscending />,
    },
  ]
}

// A render function, not a component: Arco Menu reads its items' keys from
// direct Menu.Item children.
const renderSortMenuItems = (orderDirection, sortOptions) =>
  sortOptions.map((option) => (
    <Menu.Item
      key={`sort-${option.value}`}
      onClick={() => updateSettings({ orderDirection: option.value })}
    >
      <AppMenuItemContent checked={orderDirection === option.value} icon={option.icon}>
        {option.label}
      </AppMenuItemContent>
    </Menu.Item>
  ))

/**
 * The small line above the list title saying what the list shows, e.g.
 * "Canada / Unread · Newest first". In Classic it also surfaces the View
 * menu's state, which is otherwise hidden behind an icon.
 */
const ListContext = ({ showStatusSection }) => {
  const { infoFrom } = useStore(contentState)
  const { orderDirection, showStatus } = useStore(settingsState)
  const feeds = useStore(feedsState)
  const { id } = useParams()
  const statusOptions = useStatusOptions()
  const sortOptions = useSortOptions()

  const categoryTitle =
    id && infoFrom === "feed" ? feeds.find((f) => f.id === Number(id))?.category?.title : null
  const statusLabel = showStatusSection
    ? statusOptions.find((option) => option.value === showStatus)?.label
    : null
  const sortLabel = sortOptions.find((option) => option.value === orderDirection)?.label
  const details = [statusLabel, sortLabel].filter(Boolean).join(" · ")

  return (
    <div className="content-toolbar-context">
      {categoryTitle ? (
        <span className="content-toolbar-context-parent">{categoryTitle}</span>
      ) : null}
      <span className="content-toolbar-context-details">{details}</span>
    </div>
  )
}

/** Classic: one icon menu holding both the Unread/All filter and the sort order. */
const ViewMenu = ({ showStatusSection }) => {
  const { orderDirection, showStatus } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)
  const statusOptions = useStatusOptions()
  const sortOptions = useSortOptions()
  const [visible, setVisible] = useState(false)

  return (
    <Dropdown
      popupVisible={visible}
      position="br"
      trigger="click"
      droplist={
        <AppMenu>
          {showStatusSection ? (
            <Menu.ItemGroup key="show" title={polyglot.t("article_list.view_show")}>
              {statusOptions.map((option) => (
                <Menu.Item
                  key={`show-${option.value}`}
                  onClick={() => updateSettings({ showStatus: option.value })}
                >
                  <AppMenuItemContent checked={showStatus === option.value} icon={option.icon}>
                    {option.label}
                  </AppMenuItemContent>
                </Menu.Item>
              ))}
            </Menu.ItemGroup>
          ) : null}
          {showStatusSection ? <AppMenuDivider /> : null}
          <Menu.ItemGroup key="sort" title={polyglot.t("article_list.sort_label")}>
            {renderSortMenuItems(orderDirection, sortOptions)}
          </Menu.ItemGroup>
        </AppMenu>
      }
      onVisibleChange={setVisible}
    >
      <ToolbarButton
        caret
        iconOnly
        icon={getSortIcon(orderDirection)}
        label={polyglot.t("article_list.view_options")}
        open={visible}
        tooltip={polyglot.t("article_list.view_options")}
      />
    </Dropdown>
  )
}

/** Stream: the sort order as a labelled menu button. */
const SortMenu = () => {
  const { orderDirection } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)
  const sortOptions = useSortOptions()
  const [visible, setVisible] = useState(false)
  const currentLabel = sortOptions.find((option) => option.value === orderDirection)?.label

  return (
    <Dropdown
      droplist={<AppMenu>{renderSortMenuItems(orderDirection, sortOptions)}</AppMenu>}
      popupVisible={visible}
      position="br"
      trigger="click"
      onVisibleChange={setVisible}
    >
      <ToolbarButton
        caret
        icon={getSortIcon(orderDirection)}
        label={currentLabel}
        open={visible}
        tooltip={polyglot.t("article_list.sort_label")}
      />
    </Dropdown>
  )
}

const DateFilter = () => {
  const { filterDate } = useStore(contentState)
  const { polyglot } = useStore(polyglotState)
  const [visible, setVisible] = useState(false)

  const pickDate = (date) => {
    setFilterDate(date)
    setVisible(false)
  }

  return (
    <DatePicker
      popupVisible={visible}
      position="br"
      showNowBtn={false}
      value={filterDate}
      extra={
        <div className="calendar-actions">
          <Button long size="mini" type="primary" onClick={() => pickDate(getStartOfToday())}>
            {polyglot.t("search.today")}
          </Button>
          <Button long size="mini" onClick={() => pickDate(null)}>
            {polyglot.t("search.clear_date")}
          </Button>
        </div>
      }
      triggerElement={
        <IconButton
          active={!!filterDate}
          icon={<IconCalendar />}
          label={polyglot.t("search.select_date")}
          open={visible}
        />
      }
      onChange={(value) => setFilterDate(value)}
      onVisibleChange={setVisible}
    />
  )
}

const SearchControl = () => {
  const { filterString, filterType } = useStore(contentState)
  const { polyglot } = useStore(polyglotState)
  const [visible, setVisible] = useState(false)
  const [inputValue, setInputValue] = useState("")

  const handleVisibleChange = (nextVisible) => {
    if (nextVisible) {
      setInputValue(filterString)
      setDraftFilterType(filterType)
    }

    setVisible(nextVisible)
  }

  const confirmSearch = (value) => {
    setFilterString(value)
    setVisible(false)
  }

  return (
    <Dropdown
      popupVisible={visible}
      position="br"
      trigger="click"
      unmountOnExit={false}
      droplist={
        <div className="toolbar-search-dropdown">
          <div className="toolbar-search-dropdown-header">{polyglot.t("search.search")}</div>
          <SearchForm value={inputValue} onChange={setInputValue} onConfirm={confirmSearch} />
          <div className="toolbar-search-dropdown-actions">
            <Button size="small" onClick={() => setVisible(false)}>
              {polyglot.t("search.cancel")}
            </Button>
            <Button size="small" type="primary" onClick={() => confirmSearch(inputValue)}>
              {polyglot.t("search.confirm")}
            </Button>
          </div>
        </div>
      }
      onVisibleChange={handleVisibleChange}
    >
      <IconButton
        active={!!filterString}
        icon={<IconSearch />}
        label={polyglot.t("search.search")}
        open={visible}
      />
    </Dropdown>
  )
}

/** Stream-only previous/next buttons, driven by the stream's own scroll logic. */
export const StreamNavButtons = ({ streamVirtualizerRef }) => {
  const { navigateToNextArticle, navigateToPreviousArticle } = useStreamKeyHandlers({
    streamVirtualizerRef,
  })

  return <ArticleNavGroup onNext={navigateToNextArticle} onPrevious={navigateToPreviousArticle} />
}

// The count mirrors the sidebar's tier for the open list (Sidebar.css: views,
// categories, feeds), so the same number looks the same in both places.
const COUNT_TIER_CLASS = {
  category: "content-toolbar-count--category",
  feed: "content-toolbar-count--feed",
  view: "content-toolbar-count--view",
}

/**
 * The content toolbar shared by both layouts. Same controls in the same
 * place; the Classic variant packs the filter and sort into one View menu so
 * the narrow list column keeps a single line.
 *
 * - classic: title · count … Search · Mark read ▾ · View ▾ · Date
 * - stream:  ‹ n / total › · title … Search · [Unread | All] · Mark read ▾ · Sort ▾ · Date
 *
 * Navigation leads the row so it sits where Classic's reading pane keeps it.
 *
 * Today is already a fixed 24-hour window, so it gets no date filter.
 */
const ContentToolbar = ({ variant, info, markAllAsRead, navigation = null }) => {
  const { filterDate, infoFrom, isArticleListReady } = useStore(contentState)
  const { showStatus } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)
  const dynamicCount = useStore(dynamicCountState)
  const { isBelowMedium } = useScreenWidth()
  const title = useToolbarTitle()
  const statusOptions = useStatusOptions()

  const isClassic = variant === "classic"
  // History lists everything already read, so an unread filter is meaningless.
  const showStatusFilter = infoFrom !== "history"
  const showDateFilter = infoFrom !== "today"

  // Drop a date carried over from another list: Today would still apply it,
  // with the picker hidden and no way to clear it.
  useEffect(() => {
    if (!showDateFilter && filterDate) {
      setFilterDate(null)
    }
  }, [showDateFilter, filterDate])

  // Both layouts: the list-context line (eyebrow style) over title · count.
  const heading = (
    <div className="content-toolbar-heading">
      {title ? (
        <Typography.Ellipsis
          className="content-toolbar-title"
          expandable={false}
          showTooltip={!isBelowMedium}
        >
          {title}
        </Typography.Ellipsis>
      ) : (
        <div className="content-toolbar-title-placeholder" />
      )}
      {/* Stream shows the list position in its prev/next group instead. */}
      {isClassic && isArticleListReady && dynamicCount > 0 ? (
        <span
          className={`content-toolbar-count ${COUNT_TIER_CLASS[infoFrom] ?? COUNT_TIER_CLASS.view}`}
        >
          {dynamicCount}
        </span>
      ) : null}
    </div>
  )

  return (
    <div className={classNames("content-toolbar", `content-toolbar--${variant}`)}>
      <SidebarTrigger />
      {navigation ? <div className="content-toolbar-nav">{navigation}</div> : null}
      <div className="content-toolbar-stack">
        <ListContext showStatusSection={showStatusFilter} />
        {heading}
      </div>
      <div className={classNames("content-toolbar-actions", { "app-control-group": isClassic })}>
        <SearchControl />
        {!isClassic && showStatusFilter ? (
          <SegmentedControl
            ariaLabel={polyglot.t("article_list.view_show")}
            className="content-toolbar-status"
            options={statusOptions}
            value={showStatus === "all" ? "all" : "unread"}
            onChange={(value) => updateSettings({ showStatus: value })}
          />
        ) : null}
        <MarkReadControl iconOnly={isClassic} info={info} markAllAsRead={markAllAsRead} />
        {isClassic ? <ViewMenu showStatusSection={showStatusFilter} /> : <SortMenu />}
        {showDateFilter ? <DateFilter /> : null}
      </div>
    </div>
  )
}

export default ContentToolbar
