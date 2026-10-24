import { Input, InputNumber, Select, Slider, Switch } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"

import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import { dataState } from "@/store/dataState"
import { settingsState, updateSettings } from "@/store/settingsState"
import compareVersions from "@/utils/version"

import SettingItem from "./SettingItem"
import SettingsSection from "./SettingsSection"

const commitFullTextRssUrl = (value) => updateSettings({ fullTextRssUrl: value.trim() })

const Reading = () => {
  const {
    contentFetcher,
    enableSwipeGesture,
    fullTextRssUrl,
    markReadAfterSeconds,
    markReadBy,
    markReadOnScroll,
    orderBy,
    pageSize,
    removeDuplicates,
    swipeSensitivity,
    updateContentOnFetch,
  } = useStore(settingsState)
  const { version } = useStore(dataState)
  const { polyglot } = useStore(polyglotState)
  const { isBelowMedium } = useScreenWidth()

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
      <SettingsSection title={polyglot.t("settings.group.article_list")}>
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

        <SettingItem
          description={polyglot.t("settings.entries_per_page_description")}
          title={polyglot.t("settings.entries_per_page_label")}
        >
          <InputNumber
            className="input-select"
            min={1}
            mode="button"
            value={pageSize}
            onChange={(value) => updateSettings({ pageSize: value })}
          />
        </SettingItem>

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
      </SettingsSection>

      <SettingsSection title={polyglot.t("settings.group.marking_read")}>
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

        {markReadBy === "view" && (
          <SettingItem
            nested
            description={polyglot.t("settings.mark_read_after_description")}
            title={polyglot.t("settings.mark_read_after_label")}
          >
            <InputNumber
              className="input-select"
              max={5}
              min={1}
              step={1}
              suffix={polyglot.t("settings.seconds_suffix")}
              value={markReadAfterSeconds}
              onChange={(value) =>
                updateSettings({
                  markReadAfterSeconds: typeof value === "number" ? value : 3,
                })
              }
            />
          </SettingItem>
        )}

        <SettingItem
          description={polyglot.t("settings.mark_read_on_scroll_description")}
          title={polyglot.t("settings.mark_read_on_scroll_label")}
        >
          <Switch
            checked={markReadOnScroll}
            onChange={(value) => updateSettings({ markReadOnScroll: value })}
          />
        </SettingItem>
      </SettingsSection>

      <SettingsSection title={polyglot.t("settings.group.original_content")}>
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
          <SettingItem
            nested
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
        )}

        {compareVersions(version, "2.2.8") >= 0 && (
          <SettingItem
            description={polyglot.t("settings.update_content_on_fetch_description")}
            title={polyglot.t("settings.update_content_on_fetch_label")}
          >
            <Switch
              checked={updateContentOnFetch}
              onChange={(value) => updateSettings({ updateContentOnFetch: value })}
            />
          </SettingItem>
        )}
      </SettingsSection>

      {isBelowMedium && (
        <SettingsSection title={polyglot.t("settings.group.touch")}>
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
            <SettingItem
              nested
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
          )}
        </SettingsSection>
      )}
    </>
  )
}

export default Reading
