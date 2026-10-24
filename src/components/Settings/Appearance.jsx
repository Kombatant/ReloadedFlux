import { InputNumber, Select, Switch } from "@arco-design/web-react"
import { IconDesktop, IconMoonFill, IconSunFill } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useEffect, useState } from "react"

import CustomTooltip from "@/components/ui/CustomTooltip"
import SegmentedControl from "@/components/ui/SegmentedControl"
import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"
import { settingsState, updateSettings } from "@/store/settingsState"
import {
  applyColor,
  colors,
  getDisplayColorValue,
  isDarkOnlyColor,
  isLightOnlyColor,
  isModeRestrictedColor,
} from "@/utils/colors"

import { ArticleCardPreview, ArticleTextPreview } from "./AppearancePreview"
import SettingItem from "./SettingItem"
import SettingsSection from "./SettingsSection"

import "./Appearance.css"

const handleConfigChange = (settingsChanges) => {
  updateSettings(settingsChanges)
  if (settingsChanges.themeColor) {
    applyColor(settingsChanges.themeColor)
  }
}

const useEffectiveDarkMode = () => {
  const { themeMode } = useStore(settingsState)
  const [isSystemDark, setIsSystemDark] = useState(
    globalThis.matchMedia("(prefers-color-scheme: dark)").matches,
  )

  useEffect(() => {
    const mediaQuery = globalThis.matchMedia("(prefers-color-scheme: dark)")
    const onChange = (event) => setIsSystemDark(event.matches)
    mediaQuery.addEventListener("change", onChange)
    return () => mediaQuery.removeEventListener("change", onChange)
  }, [])

  return themeMode === "system" ? isSystemDark : themeMode === "dark"
}

const Appearance = () => {
  const {
    animationsEnabled,
    articleWidth,
    cardIconBackdrop,
    edgeToEdgeImages,
    fontFamily,
    fontSize,
    showDetailedRelativeTime,
    showEstimatedReadingTime,
    showFeedIcon,
    themeColor,
    themeMode,
    titleAlignment,
  } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)
  const { isBelowMedium } = useScreenWidth()
  const isDark = useEffectiveDarkMode()

  const cardIconBackdropOptions = [
    { label: polyglot.t("appearance.card_icon_backdrop_off"), value: "off" },
    { label: polyglot.t("appearance.card_icon_backdrop_icon"), value: "icon" },
    { label: polyglot.t("appearance.card_icon_backdrop_glow"), value: "glow" },
    { label: polyglot.t("appearance.card_icon_backdrop_glass"), value: "glass" },
  ]

  const fontFamilyOptions = [
    { label: polyglot.t("appearance.font_family_system"), value: "system-ui" },
    { label: "Inter", value: "'Inter', sans-serif" },
    { label: "Lato", value: "'Lato', sans-serif" },
    { label: "Sans-serif", value: "sans-serif" },
    { label: "Serif", value: "serif" },
    { label: "Fira Sans", value: "'Fira Sans', sans-serif" },
    { label: "Open Sans", value: "'Open Sans', sans-serif" },
    { label: "Source Sans Pro", value: "'Source Sans Pro', sans-serif" },
    { label: "Source Serif Pro", value: "'Source Serif Pro', serif" },
    {
      label: polyglot.t("appearance.font_family_noto_sans"),
      value: "'Noto Sans SC', sans-serif",
    },
    {
      label: polyglot.t("appearance.font_family_noto_serif"),
      value: "'Noto Serif SC', serif",
    },
    {
      label: polyglot.t("appearance.font_family_lxgw_wenkai"),
      value: "'LXGW WenKai Screen', sans-serif",
    },
  ]

  const themeModeOptions = [
    { value: "system", icon: <IconDesktop />, label: polyglot.t("sidebar.theme_system") },
    { value: "light", icon: <IconSunFill />, label: polyglot.t("sidebar.theme_light") },
    { value: "dark", icon: <IconMoonFill />, label: polyglot.t("sidebar.theme_dark") },
  ]

  return (
    <>
      <SettingsSection title={polyglot.t("settings.group.theme")}>
        <SettingItem
          description={polyglot.t("settings.theme_mode_description")}
          title={polyglot.t("sidebar.theme_label")}
        >
          <SegmentedControl
            ariaLabel={polyglot.t("sidebar.theme_label")}
            options={themeModeOptions}
            value={themeMode}
            onChange={(value) => updateSettings({ themeMode: value })}
          />
        </SettingItem>

        <SettingItem
          description={polyglot.t("appearance.theme_color_description")}
          title={polyglot.t("appearance.theme_color_label")}
        >
          <div
            aria-label={polyglot.t("appearance.theme_color_label")}
            className="color-swatches"
            role="radiogroup"
          >
            {Object.keys(colors)
              .filter((colorName) => !isModeRestrictedColor(colorName, isDark))
              .map((colorName) => {
                const hex = colors[colorName]?.light || getDisplayColorValue(colorName)
                let tooltip = `${colorName} — ${hex}`
                if (isDarkOnlyColor(colorName)) {
                  tooltip = polyglot.t("appearance.theme_color_oled_description")
                } else if (isLightOnlyColor(colorName)) {
                  tooltip = polyglot.t("appearance.theme_color_gray_description")
                }
                const isSelected = colorName === themeColor
                return (
                  <CustomTooltip key={colorName} mini content={tooltip}>
                    <button
                      aria-checked={isSelected}
                      className={isSelected ? "color-swatch is-selected" : "color-swatch"}
                      role="radio"
                      style={{ "--swatch-color": getDisplayColorValue(colorName) }}
                      type="button"
                      aria-label={polyglot.t("appearance.theme_color_aria_label", {
                        color: colorName,
                      })}
                      onClick={() => handleConfigChange({ themeColor: colorName })}
                    />
                  </CustomTooltip>
                )
              })}
          </div>
        </SettingItem>

        <SettingItem
          description={polyglot.t("appearance.font_family_description")}
          title={polyglot.t("appearance.font_family_label")}
        >
          <Select
            className="input-select"
            getPopupContainer={() => document.body}
            value={fontFamily}
            onChange={(value) => handleConfigChange({ fontFamily: value })}
          >
            {fontFamilyOptions.map(({ label, value }) => (
              <Select.Option key={value} value={value}>
                {label}
              </Select.Option>
            ))}
          </Select>
        </SettingItem>
      </SettingsSection>

      <SettingsSection title={polyglot.t("settings.group.article_text")}>
        <SettingItem
          title={
            polyglot.t("settings.content.article_font_size_label") ||
            polyglot.t("appearance.font_size_label")
          }
        >
          <InputNumber
            className="input-select"
            max={1.25}
            min={0.75}
            step={0.05}
            suffix="rem"
            value={fontSize}
            onChange={(value) => updateSettings({ fontSize: value })}
          />
        </SettingItem>

        <SettingItem title={polyglot.t("appearance.article_width_label")}>
          <InputNumber
            className="input-select"
            max={100}
            min={50}
            step={2}
            suffix="%"
            value={articleWidth}
            onChange={(value) => updateSettings({ articleWidth: value })}
          />
        </SettingItem>

        <SettingItem
          description={polyglot.t("settings.content.title_alignment_description")}
          title={polyglot.t("appearance.title_alignment_label")}
        >
          <Select
            className="input-select"
            getPopupContainer={() => document.body}
            value={titleAlignment}
            onChange={(value) => updateSettings({ titleAlignment: value })}
          >
            <Select.Option value="left">
              {polyglot.t("appearance.title_alignment_left") || "Left"}
            </Select.Option>
            <Select.Option value="center">
              {polyglot.t("appearance.title_alignment_center") || "Centre"}
            </Select.Option>
            <Select.Option value="justify">
              {polyglot.t("appearance.title_alignment_justify") || "Justified"}
            </Select.Option>
          </Select>
        </SettingItem>

        {/* The full-bleed image styles only exist below the medium breakpoint. */}
        {isBelowMedium && (
          <SettingItem
            description={polyglot.t("appearance.edge_to_edge_images_description")}
            title={polyglot.t("appearance.edge_to_edge_images_label")}
          >
            <Switch
              checked={edgeToEdgeImages}
              onChange={(value) => updateSettings({ edgeToEdgeImages: value })}
            />
          </SettingItem>
        )}

        <ArticleTextPreview />
      </SettingsSection>

      <SettingsSection
        note={polyglot.t("settings.group.article_cards_note")}
        title={polyglot.t("settings.group.article_cards")}
      >
        <SettingItem
          description={polyglot.t("appearance.card_icon_backdrop_description")}
          title={polyglot.t("appearance.card_icon_backdrop_label")}
        >
          <Select
            className="input-select"
            getPopupContainer={() => document.body}
            value={cardIconBackdrop}
            onChange={(value) => updateSettings({ cardIconBackdrop: value })}
          >
            {cardIconBackdropOptions.map(({ label, value }) => (
              <Select.Option key={value} value={value}>
                {label}
              </Select.Option>
            ))}
          </Select>
        </SettingItem>

        <SettingItem
          description={polyglot.t("appearance.show_feed_icon_description")}
          title={polyglot.t("appearance.show_feed_icon_label")}
        >
          <Switch
            checked={showFeedIcon}
            onChange={(value) => updateSettings({ showFeedIcon: value })}
          />
        </SettingItem>

        <SettingItem
          description={polyglot.t("appearance.show_detailed_relative_time_description")}
          title={polyglot.t("appearance.show_detailed_relative_time_label")}
        >
          <Switch
            checked={showDetailedRelativeTime}
            onChange={(value) => updateSettings({ showDetailedRelativeTime: value })}
          />
        </SettingItem>

        <SettingItem
          description={polyglot.t("appearance.show_estimated_reading_time_description")}
          title={polyglot.t("appearance.show_estimated_reading_time_label")}
        >
          <Switch
            checked={showEstimatedReadingTime}
            onChange={(value) => updateSettings({ showEstimatedReadingTime: value })}
          />
        </SettingItem>

        <ArticleCardPreview />
      </SettingsSection>

      <SettingsSection title={polyglot.t("settings.group.motion")}>
        <SettingItem
          description={polyglot.t("appearance.lightbox_animation_description")}
          title={polyglot.t("appearance.lightbox_animation_label")}
        >
          <Switch
            checked={animationsEnabled}
            onChange={(checked) => handleConfigChange({ animationsEnabled: checked })}
          />
        </SettingItem>
      </SettingsSection>
    </>
  )
}

export default Appearance
