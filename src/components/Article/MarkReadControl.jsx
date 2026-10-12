import { Dropdown, Menu, Popconfirm } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { useMemo, useState } from "react"

import {
  getAllEntries,
  getCategoryEntries,
  getCounters,
  getFeedEntries,
  getTodayEntries,
  updateEntriesStatus,
} from "@/apis"
import DoubleCheck from "@/components/icons/DoubleCheck"
import { AppMenu, AppMenuItemContent } from "@/components/ui/AppMenu"
import ToolbarButton from "@/components/ui/ToolbarButton"
import { polyglotState } from "@/hooks/useLanguage"
import { contentState, setEntries } from "@/store/contentState"
import { dataState, setUnreadInfo, setUnreadTodayCount } from "@/store/dataState"
import { get24HoursAgoTimestamp } from "@/utils/date"
import { Notification } from "@/utils/feedback"

const DAY_SECONDS = 24 * 60 * 60
const MAX_ENTRIES_PER_REQUEST = 1000

const getUnixSecondsFromDateString = (dateString) => {
  if (!dateString) {
    return null
  }
  if (/^\d+$/.test(dateString)) {
    return Number(dateString)
  }
  const timeMs = Date.parse(dateString)
  return Number.isFinite(timeMs) ? Math.floor(timeMs / 1000) : null
}

const fetchAllUnreadEntries = async (fetchEntries) => {
  const firstResponse = await fetchEntries()
  const unreadCount = firstResponse.total
  let unreadEntries = firstResponse.entries

  // Miniflux caps `limit` at 1000, so page through the results with offset
  // instead of requesting `unreadCount` in a single call.
  while (unreadEntries.length < unreadCount) {
    const response = await fetchEntries({
      limit: MAX_ENTRIES_PER_REQUEST,
      offset: unreadEntries.length,
    })
    if (response.entries.length === 0) {
      break
    }
    unreadEntries = [...unreadEntries, ...response.entries]
  }

  return unreadEntries
}

const updateEntriesAsRead = (publishedBeforeUnix = null) => {
  setEntries((prev) =>
    prev.map((entry) => {
      if (publishedBeforeUnix == null) {
        return { ...entry, status: "read" }
      }

      const publishedAtUnix = getUnixSecondsFromDateString(entry.published_at)
      if (publishedAtUnix != null && publishedAtUnix <= publishedBeforeUnix) {
        return { ...entry, status: "read" }
      }

      return entry
    }),
  )
}

const markUnreadEntriesAsRead = async (fetchEntries) => {
  const unreadEntries = await fetchAllUnreadEntries(fetchEntries)
  if (unreadEntries.length > 0) {
    await updateEntriesStatus(
      unreadEntries.map((entry) => entry.id),
      "read",
    )
  }
}

const secondsAgo = (days) => Math.floor(Date.now() / 1000) - days * DAY_SECONDS

// Menu order, top to bottom; "all" is always last.
const OLDER_THAN_ACTIONS = [
  {
    key: "older-day",
    menuKey: "article_list.mark_as_read_menu_older_day",
    confirmKey: "article_list.mark_older_than_day_confirm",
    successKey: "article_list.mark_older_than_day_success",
    getCutoff: () => get24HoursAgoTimestamp(),
  },
  {
    key: "older-2-days",
    menuKey: "article_list.mark_as_read_menu_older_two_days",
    confirmKey: "article_list.mark_older_than_two_days_confirm",
    successKey: "article_list.mark_older_than_two_days_success",
    getCutoff: () => secondsAgo(2),
  },
  {
    key: "older-3-days",
    menuKey: "article_list.mark_as_read_menu_older_three_days",
    confirmKey: "article_list.mark_older_than_three_days_confirm",
    successKey: "article_list.mark_older_than_three_days_success",
    getCutoff: () => secondsAgo(3),
  },
  {
    key: "older-week",
    menuKey: "article_list.mark_as_read_menu_older_week",
    confirmKey: "article_list.mark_older_than_week_confirm",
    successKey: "article_list.mark_older_than_week_success",
    getCutoff: () => secondsAgo(7),
  },
  {
    key: "older-2-weeks",
    menuKey: "article_list.mark_as_read_menu_older_two_weeks",
    confirmKey: "article_list.mark_older_than_two_weeks_confirm",
    successKey: "article_list.mark_older_than_two_weeks_success",
    getCutoff: () => secondsAgo(14),
  },
]

/**
 * Mark-as-read control for the content toolbar: a menu of "older than"
 * cut-offs plus "mark all", each behind a confirm. The Today view only offers
 * "mark all", so it is a plain button. Hidden in Starred and History.
 */
const MarkReadControl = ({ info, markAllAsRead, iconOnly = false }) => {
  const { filterDate } = useStore(contentState)
  const { feedsData } = useStore(dataState)
  const { polyglot } = useStore(polyglotState)

  const [dropdownVisible, setDropdownVisible] = useState(false)
  const [confirmVisible, setConfirmVisible] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)

  const confirmTitle = useMemo(() => {
    if (pendingAction === "all") {
      return info.from === "today"
        ? polyglot.t("article_list.mark_today_as_read_confirm")
        : polyglot.t("article_list.mark_all_as_read_confirm")
    }

    const action = OLDER_THAN_ACTIONS.find(({ key }) => key === pendingAction)
    return action ? polyglot.t(action.confirmKey) : ""
  }, [info.from, pendingAction, polyglot])

  const updateUIAfterMarkAsRead = async (publishedBeforeUnix, successMessageKey) => {
    updateEntriesAsRead(publishedBeforeUnix)

    const countersData = await getCounters()
    const unreadInfo = {}
    for (const feed of feedsData) {
      unreadInfo[feed.id] = countersData.unreads[feed.id] ?? 0
    }

    setUnreadInfo(unreadInfo)

    if (info.from === "today" && publishedBeforeUnix == null) {
      setUnreadTodayCount(0)
    }

    Notification.success({ title: polyglot.t(successMessageKey) })
  }

  const notifyError = (error) => {
    console.error("Failed to mark articles as read:", error)
    Notification.error({
      title: polyglot.t("article_list.mark_all_as_read_error"),
      content: error.message,
    })
  }

  const handleMarkAllAsRead = async () => {
    try {
      if (filterDate && info.from !== "today") {
        // A date filter narrows the list, so only mark what it shows.
        const entryFetchers = {
          all: (options) => getAllEntries("unread", options),
          feed: (options) => getFeedEntries(info.id, "unread", false, options),
          category: (options) => getCategoryEntries(info.id, "unread", false, options),
        }
        const fetchEntries = entryFetchers[info.from]
        await markUnreadEntriesAsRead((options = {}) => fetchEntries(options))
      } else {
        await markAllAsRead()
      }
      await updateUIAfterMarkAsRead(null, "article_list.mark_all_as_read_success")
    } catch (error) {
      notifyError(error)
    }
  }

  const handleMarkOlderThanAsRead = async ({ getCutoff, successKey }) => {
    const publishedBeforeUnix = getCutoff()
    const filters = { published_before: publishedBeforeUnix }
    const entryFetchers = {
      all: (options = {}) => getAllEntries("unread", { ...filters, ...options }),
      today: (options = {}) => getTodayEntries("unread", { ...filters, ...options }),
      feed: (options = {}) => getFeedEntries(info.id, "unread", false, { ...filters, ...options }),
      category: (options = {}) =>
        getCategoryEntries(info.id, "unread", false, { ...filters, ...options }),
    }

    const fetchEntries = entryFetchers[info.from]
    if (!fetchEntries) {
      return
    }

    try {
      await markUnreadEntriesAsRead(fetchEntries)
      await updateUIAfterMarkAsRead(publishedBeforeUnix, successKey)
    } catch (error) {
      notifyError(error)
    }
  }

  const openConfirm = (action) => {
    setPendingAction(action)
    setDropdownVisible(false)
    setConfirmVisible(true)
  }

  const handleConfirmOk = () => {
    const action = OLDER_THAN_ACTIONS.find(({ key }) => key === pendingAction)
    return action ? handleMarkOlderThanAsRead(action) : handleMarkAllAsRead()
  }

  const handleConfirmVisibleChange = (visible) => {
    if (!visible) {
      setConfirmVisible(false)
      setPendingAction(null)
    }
  }

  if (["starred", "history"].includes(info.from)) {
    return null
  }

  const isToday = info.from === "today"
  const tooltip = isToday
    ? polyglot.t("article_list.mark_today_as_read_tooltip")
    : polyglot.t("article_list.mark_as_read_options_tooltip")

  const confirm = (trigger) => (
    <Popconfirm
      focusLock
      popupVisible={confirmVisible}
      title={confirmTitle}
      triggerProps={{ disabled: true }}
      onOk={handleConfirmOk}
      onVisibleChange={handleConfirmVisibleChange}
    >
      {trigger}
    </Popconfirm>
  )

  if (isToday) {
    return confirm(
      <ToolbarButton
        icon={<DoubleCheck />}
        iconOnly={iconOnly}
        label={polyglot.t("article_card.mark_as_read_tooltip")}
        open={confirmVisible}
        tooltip={tooltip}
        onClick={() => openConfirm("all")}
      />,
    )
  }

  return (
    <Dropdown
      popupVisible={dropdownVisible}
      position="br"
      trigger="click"
      droplist={
        <AppMenu>
          {OLDER_THAN_ACTIONS.map((action) => (
            <Menu.Item key={action.key} onClick={() => openConfirm(action.key)}>
              <AppMenuItemContent icon={<DoubleCheck />}>
                {polyglot.t(action.menuKey)}
              </AppMenuItemContent>
            </Menu.Item>
          ))}
          <Menu.Item key="all" onClick={() => openConfirm("all")}>
            <AppMenuItemContent icon={<DoubleCheck />}>
              {polyglot.t("article_list.mark_all_as_read_tooltip")}
            </AppMenuItemContent>
          </Menu.Item>
        </AppMenu>
      }
      onVisibleChange={setDropdownVisible}
    >
      {confirm(
        <ToolbarButton
          caret
          icon={<DoubleCheck />}
          iconOnly={iconOnly}
          label={polyglot.t("article_card.mark_as_read_tooltip")}
          open={dropdownVisible || confirmVisible}
          tooltip={tooltip}
        />,
      )}
    </Dropdown>
  )
}

export default MarkReadControl
