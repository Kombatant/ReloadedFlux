import { Divider, Input, InputNumber, Select, Slider, Switch } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"

import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import { settingsState, updateSettings } from "@/store/settingsState"

import SettingItem from "./SettingItem"

const commitFullTextRssUrl = (value) => updateSettings({ fullTextRssUrl: value.trim() })

const Reading = () => {
  const {
    contentFetcher,
    enableContextMenu,
    enableSwipeGesture,
    fullTextRssUrl,
    layoutMode,
    markReadAfterSeconds,
    markReadBy,
    markReadOnScroll,
    orderBy,
    pageSize,
    removeDuplicates,
    streamRenderSelectedOnly,
    swipeSensitivity,
  } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)
  const { isBelowMedium } = useScreenWidth()
  const isCombinedLayout = layoutMode === "stream"

  const removeDuplicatesOptions = [
    { label: polyglot.t("settings.remove_duplicates_option_none"), value: "none" },
    { label: polyglot.t("settings.remove_duplicates_option_hash"), value: "hash" },
    { label: polyglot.t("settings.remove_duplicates_option_title"), value: "title" },
    { label: polyglot.t("settings.remove_duplicates_option_url"), value: "url" },
  ]

  const contentFetcherOptions = [
    { label: polyglot.t("settings.content_fetcher_option_miniflux"), value: "miniflux" },
    { label: polyglot.t("settings.content_fetcher_option_fulltextrss"), value: "fulltextrss" },
  ]

  return (
    <>
      <SettingItem
        description={polyglot.t("settings.entries_order_description")}
        title={polyglot.t("settings.entries_order_label")}
      >
        <Select
          className="input-select"
          getPopupContainer={() => document.body}
          value={orderBy}
          onChange={(value) => updateSettings({ orderBy: value })}
        >
          <Select.Option value="published_at">
            {polyglot.t("settings.entries_order_option_published_at")}
          </Select.Option>
          <Select.Option value="created_at">
            {polyglot.t("settings.entries_order_option_created_at")}
          </Select.Option>
        </Select>
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("settings.entries_per_page_description")}
        title={polyglot.t("settings.entries_per_page_label")}
      >
        <InputNumber
          className="input-select"
          defaultValue={pageSize}
          min={1}
          mode="button"
          size="small"
          onChange={(value) => updateSettings({ pageSize: value })}
        />
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("settings.remove_duplicates_description")}
        title={polyglot.t("settings.remove_duplicates_label")}
      >
        <Select
          className="input-select"
          getPopupContainer={() => document.body}
          value={removeDuplicates}
          onChange={(value) => updateSettings({ removeDuplicates: value })}
        >
          {removeDuplicatesOptions.map(({ label, value }) => (
            <Select.Option key={value} value={value}>
              {label}
            </Select.Option>
          ))}
        </Select>
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("settings.mark_read_by_description")}
        title={polyglot.t("settings.mark_read_by_label")}
      >
        <Select
          className="input-select"
          getPopupContainer={() => document.body}
          value={markReadBy}
          onChange={(value) => updateSettings({ markReadBy: value })}
        >
          <Select.Option value="view">{polyglot.t("settings.mark_read_on_view")}</Select.Option>
          <Select.Option value="manually">
            {polyglot.t("settings.mark_read_manually")}
          </Select.Option>
        </Select>
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("settings.mark_read_after_description")}
        disabled={markReadBy !== "view"}
        disabledLabel={polyglot.t("settings.disabled_label")}
        disabledReason={polyglot.t("settings.mark_read_after_disabled_reason")}
        title={polyglot.t("settings.mark_read_after_label")}
      >
        <InputNumber
          className="input-select"
          disabled={markReadBy !== "view"}
          max={5}
          min={1}
          size="small"
          step={1}
          style={{ width: 120 }}
          suffix={polyglot.t("settings.seconds_suffix")}
          value={markReadAfterSeconds}
          onChange={(value) =>
            updateSettings({
              markReadAfterSeconds: typeof value === "number" ? value : 3,
            })
          }
        />
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("settings.mark_read_on_scroll_description")}
        title={polyglot.t("settings.mark_read_on_scroll_label")}
      >
        <Switch
          checked={markReadOnScroll}
          onChange={(value) => updateSettings({ markReadOnScroll: value })}
        />
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("settings.enable_context_menu_description")}
        disabled={isCombinedLayout}
        disabledLabel={polyglot.t("settings.disabled_label")}
        title={polyglot.t("settings.enable_context_menu_label")}
        disabledReason={polyglot.t("settings.only_available_in_layout", {
          layout: polyglot.t("appearance.layout_mode_classic"),
        })}
      >
        <Switch
          checked={enableContextMenu}
          disabled={isCombinedLayout}
          onChange={(value) => updateSettings({ enableContextMenu: value })}
        />
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("settings.content.stream_render_selected_only_description")}
        disabled={!isCombinedLayout}
        disabledLabel={polyglot.t("settings.disabled_label")}
        title={polyglot.t("settings.content.stream_render_selected_only_label")}
        disabledReason={polyglot.t("settings.only_available_in_layout", {
          layout: polyglot.t("appearance.layout_mode_stream"),
        })}
      >
        <Switch
          checked={streamRenderSelectedOnly}
          disabled={!isCombinedLayout}
          onChange={(value) => updateSettings({ streamRenderSelectedOnly: value })}
        />
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("settings.content_fetcher_description")}
        title={polyglot.t("settings.content_fetcher_label")}
      >
        <Select
          className="input-wide"
          getPopupContainer={() => document.body}
          value={contentFetcher}
          onChange={(value) => updateSettings({ contentFetcher: value })}
        >
          {contentFetcherOptions.map(({ label, value }) => (
            <Select.Option key={value} value={value}>
              {label}
            </Select.Option>
          ))}
        </Select>
      </SettingItem>

      {contentFetcher === "fulltextrss" && (
        <>
          <Divider />

          <SettingItem
            description={polyglot.t("settings.full_text_rss_url_description")}
            title={polyglot.t("settings.full_text_rss_url_label")}
          >
            {/* Keyed on the stored value so it resyncs after a commit or settings import */}
            <Input
              key={fullTextRssUrl}
              allowClear
              className="input-wide"
              defaultValue={fullTextRssUrl}
              placeholder={polyglot.t("settings.full_text_rss_url_placeholder")}
              onBlur={(event) => commitFullTextRssUrl(event.target.value)}
              onClear={() => commitFullTextRssUrl("")}
              onPressEnter={(event) => commitFullTextRssUrl(event.target.value)}
            />
          </SettingItem>
        </>
      )}

      {isBelowMedium && (
        <>
          <Divider />

          <SettingItem
            description={polyglot.t("settings.enable_swipe_gesture_description")}
            title={polyglot.t("settings.enable_swipe_gesture_label")}
          >
            <Switch
              checked={enableSwipeGesture}
              onChange={(value) => updateSettings({ enableSwipeGesture: value })}
            />
          </SettingItem>

          {enableSwipeGesture && (
            <>
              <Divider />

              <SettingItem
                description={polyglot.t("settings.swipe_sensitivity_description")}
                title={polyglot.t("settings.swipe_sensitivity_label")}
              >
                <Slider
                  className="input-slider"
                  max={1.5}
                  min={0.5}
                  showTicks={true}
                  step={0.25}
                  value={swipeSensitivity}
                  onChange={(value) => updateSettings({ swipeSensitivity: value })}
                />
              </SettingItem>
            </>
          )}
        </>
      )}
    </>
  )
}

export default Reading
