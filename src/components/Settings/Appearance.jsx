import { Divider, Select, Switch } from "@arco-design/web-react"
import { useStore } from "@nanostores/react"
import { useEffect, useState } from "react"

import { LayoutColumnIcon, LayoutCombinedIcon } from "@/components/icons/LayoutModeIcons"
import CustomTooltip from "@/components/ui/CustomTooltip"
import { polyglotState } from "@/hooks/useLanguage"
import { settingsState, updateSettings } from "@/store/settingsState"
import {
  applyColor,
  colors,
  getDisplayColorValue,
  isDarkOnlyColor,
  isLightOnlyColor,
  isModeRestrictedColor,
} from "@/utils/colors"

import SettingItem from "./SettingItem"

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
    cardIconBackdrop,
    compactSidebarGroups,
    fontFamily,
    layoutMode,
    streamTimeline,
    themeColor,
  } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)
  const isDark = useEffectiveDarkMode()
  const isCombinedLayout = layoutMode === "stream"

  const cardIconBackdropOptions = [
    { label: polyglot.t("appearance.card_icon_backdrop_off"), value: "off" },
    { label: polyglot.t("appearance.card_icon_backdrop_icon"), value: "icon" },
    { label: polyglot.t("appearance.card_icon_backdrop_glow"), value: "glow" },
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

  const layoutOptions = [
    {
      icon: <LayoutColumnIcon />,
      label: polyglot.t("appearance.layout_mode_classic"),
      value: "classic",
    },
    {
      icon: <LayoutCombinedIcon />,
      label: polyglot.t("appearance.layout_mode_stream"),
      value: "stream",
    },
  ]

  return (
    <>
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

      <Divider />

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

      <Divider />

      <SettingItem
        description={polyglot.t("appearance.layout_mode_description")}
        title={polyglot.t("appearance.layout_mode_label")}
      >
        <Select
          className="input-select"
          getPopupContainer={() => document.body}
          value={layoutMode}
          onChange={(value) => handleConfigChange({ layoutMode: value })}
        >
          {layoutOptions.map((option) => (
            <Select.Option key={option.value} value={option.value}>
              <span className="layout-mode-option">
                {option.icon}
                <span>{option.label}</span>
              </span>
            </Select.Option>
          ))}
        </Select>
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("appearance.stream_timeline_description")}
        disabled={!isCombinedLayout}
        disabledLabel={polyglot.t("settings.disabled_label")}
        title={polyglot.t("appearance.stream_timeline_label")}
        disabledReason={polyglot.t("settings.only_available_in_layout", {
          layout: polyglot.t("appearance.layout_mode_stream"),
        })}
      >
        <Switch
          checked={streamTimeline}
          disabled={!isCombinedLayout}
          onChange={(value) => handleConfigChange({ streamTimeline: value })}
        />
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("appearance.card_icon_backdrop_description")}
        title={polyglot.t("appearance.card_icon_backdrop_label")}
      >
        <Select
          className="input-select"
          getPopupContainer={() => document.body}
          value={cardIconBackdrop}
          onChange={(value) => handleConfigChange({ cardIconBackdrop: value })}
        >
          {cardIconBackdropOptions.map(({ label, value }) => (
            <Select.Option key={value} value={value}>
              {label}
            </Select.Option>
          ))}
        </Select>
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("appearance.lightbox_animation_description")}
        title={polyglot.t("appearance.lightbox_animation_label")}
      >
        <Switch
          checked={animationsEnabled}
          onChange={(checked) =>
            handleConfigChange({
              animationsEnabled: checked,
            })
          }
        />
      </SettingItem>

      <Divider />

      <SettingItem
        description={polyglot.t("settings.compact_sidebar_groups_description")}
        title={polyglot.t("settings.compact_sidebar_groups_label")}
      >
        <Switch
          checked={compactSidebarGroups}
          onChange={(value) => handleConfigChange({ compactSidebarGroups: value })}
        />
      </SettingItem>
    </>
  )
}

export default Appearance
