import { Button, Select, Switch, Typography } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { useState } from "react"

import LayoutPicker from "@/components/ui/LayoutPicker"
import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import { settingsState, updateSettings } from "@/store/settingsState"

import SettingItem from "./SettingItem"
import SettingsSection from "./SettingsSection"

/**
 * Options that only apply to one reading layout. The active layout's group is
 * editable; the other collapses to a summary that can be expanded (read-only)
 * or switched to.
 */
const LayoutOptions = ({ active, count, layout, layoutLabel, renderRows, title }) => {
  const { polyglot } = useStore(polyglotState)
  const [expanded, setExpanded] = useState(false)

  if (active) {
    return <SettingsSection title={title}>{renderRows(false)}</SettingsSection>
  }

  return (
    <SettingsSection title={title}>
      <div className="settings-inactive-group">
        <span className="setting-row-status">{polyglot.t("settings.group.inactive")}</span>
        <Typography.Text className="settings-inactive-group-text" type="secondary">
          {polyglot.t("settings.group.inactive_description", { count, layout: layoutLabel })}
        </Typography.Text>
        <div className="setting-row-actions">
          <Button aria-expanded={expanded} type="text" onClick={() => setExpanded(!expanded)}>
            {polyglot.t(expanded ? "settings.group.hide" : "settings.group.show")}
          </Button>
          <Button onClick={() => updateSettings({ layoutMode: layout })}>
            {polyglot.t("settings.group.switch_to", { layout: layoutLabel })}
          </Button>
        </div>
      </div>
      {expanded ? renderRows(true) : null}
    </SettingsSection>
  )
}

const Layout = () => {
  const {
    compactSidebarGroups,
    coverDisplayMode,
    enableContextMenu,
    layoutMode,
    showHiddenFeeds,
    showUnreadFeedsOnly,
    streamImageLayout,
    streamRenderSelectedOnly,
    streamTimeline,
  } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)
  const { isBelowMedium } = useScreenWidth()

  // Content always uses columns on small screens, so follow what is on screen.
  const activeLayout = isBelowMedium ? "classic" : layoutMode
  const classicLabel = polyglot.t("appearance.layout_mode_classic")
  const streamLabel = polyglot.t("appearance.layout_mode_stream")

  const renderClassicRows = (disabled) => (
    <>
      <SettingItem
        description={polyglot.t("appearance.cover_display_mode_description")}
        disabled={disabled}
        title={polyglot.t("appearance.cover_display_mode_label")}
      >
        <Select
          className="input-select"
          disabled={disabled}
          getPopupContainer={() => document.body}
          value={coverDisplayMode}
          onChange={(value) => updateSettings({ coverDisplayMode: value })}
        >
          <Select.Option value="auto">
            {polyglot.t("appearance.cover_display_mode_auto")}
          </Select.Option>
          <Select.Option value="banner">
            {polyglot.t("appearance.cover_display_mode_banner")}
          </Select.Option>
          <Select.Option value="thumbnail">
            {polyglot.t("appearance.cover_display_mode_thumbnail")}
          </Select.Option>
        </Select>
      </SettingItem>

      <SettingItem
        description={polyglot.t("settings.enable_context_menu_description")}
        disabled={disabled}
        title={polyglot.t("settings.enable_context_menu_label")}
      >
        <Switch
          checked={enableContextMenu}
          disabled={disabled}
          onChange={(value) => updateSettings({ enableContextMenu: value })}
        />
      </SettingItem>
    </>
  )

  const renderStreamRows = (disabled) => (
    <>
      <SettingItem
        description={polyglot.t("appearance.stream_timeline_description")}
        disabled={disabled}
        title={polyglot.t("appearance.stream_timeline_label")}
      >
        <Switch
          checked={streamTimeline}
          disabled={disabled}
          onChange={(value) => updateSettings({ streamTimeline: value })}
        />
      </SettingItem>

      <SettingItem
        description={polyglot.t("appearance.stream_image_layout_description")}
        disabled={disabled}
        title={polyglot.t("appearance.stream_image_layout_label")}
      >
        <Select
          className="input-select"
          disabled={disabled}
          getPopupContainer={() => document.body}
          value={streamImageLayout}
          onChange={(value) => updateSettings({ streamImageLayout: value })}
        >
          <Select.Option value="full">
            {polyglot.t("appearance.stream_image_layout_full")}
          </Select.Option>
          <Select.Option value="capped">
            {polyglot.t("appearance.stream_image_layout_capped")}
          </Select.Option>
          <Select.Option value="right">
            {polyglot.t("appearance.stream_image_layout_right")}
          </Select.Option>
        </Select>
      </SettingItem>

      <SettingItem
        description={polyglot.t("settings.content.stream_render_selected_only_description")}
        disabled={disabled}
        title={polyglot.t("settings.content.stream_render_selected_only_label")}
      >
        <Switch
          checked={streamRenderSelectedOnly}
          disabled={disabled}
          onChange={(value) => updateSettings({ streamRenderSelectedOnly: value })}
        />
      </SettingItem>
    </>
  )

  return (
    <>
      <SettingsSection title={polyglot.t("settings.group.reading_layout")}>
        <SettingItem
          title={polyglot.t("appearance.layout_mode_label")}
          description={
            isBelowMedium
              ? polyglot.t("settings.layout_mobile_note", {
                  classic: classicLabel,
                  combined: streamLabel,
                })
              : polyglot.t("appearance.layout_mode_description")
          }
        >
          <LayoutPicker
            ariaLabel={polyglot.t("appearance.layout_mode_label")}
            className="settings-layout-picker"
            value={activeLayout}
            options={[
              { value: "classic", label: classicLabel },
              { value: "stream", label: streamLabel, disabled: isBelowMedium },
            ]}
            onChange={(value) => updateSettings({ layoutMode: value })}
          />
        </SettingItem>
      </SettingsSection>

      <LayoutOptions
        active={activeLayout === "classic"}
        count={2}
        layout="classic"
        layoutLabel={classicLabel}
        renderRows={renderClassicRows}
        title={polyglot.t("settings.group.classic_options")}
      />

      {isBelowMedium ? null : (
        <LayoutOptions
          active={activeLayout === "stream"}
          count={3}
          layout="stream"
          layoutLabel={streamLabel}
          renderRows={renderStreamRows}
          title={polyglot.t("settings.group.stream_options")}
        />
      )}

      <SettingsSection
        note={polyglot.t("settings.group.sidebar_note")}
        title={polyglot.t("settings.group.sidebar")}
      >
        <SettingItem
          description={polyglot.t("settings.compact_sidebar_groups_description")}
          title={polyglot.t("settings.compact_sidebar_groups_label")}
        >
          <Switch
            checked={compactSidebarGroups}
            onChange={(value) => updateSettings({ compactSidebarGroups: value })}
          />
        </SettingItem>

        <SettingItem
          description={polyglot.t("settings.content.show_hidden_description")}
          title={polyglot.t("sidebar.show_hidden_feeds")}
        >
          <Switch
            checked={showHiddenFeeds}
            onChange={(value) => updateSettings({ showHiddenFeeds: value })}
          />
        </SettingItem>

        <SettingItem
          description={polyglot.t("settings.content.feeds_show_unread_description")}
          title={polyglot.t("settings.content.feeds_show_unread_label")}
        >
          <Switch
            checked={showUnreadFeedsOnly}
            onChange={(value) => updateSettings({ showUnreadFeedsOnly: value })}
          />
        </SettingItem>
      </SettingsSection>
    </>
  )
}

export default Layout
