import {
  IconCommand,
  IconEye,
  IconLayout,
  IconRobot,
  IconSkin,
  IconStorage,
  IconUnorderedList,
} from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import classNames from "classnames"
import SimpleBar from "simplebar-react"

import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"

import Ai from "./Ai"
import Appearance from "./Appearance"
import General from "./General"
import Hotkeys from "./Hotkeys"
import Layout from "./Layout"
import Reading from "./Reading"
import Subscriptions from "./Subscriptions"

import "./SettingsTabs.css"

// Preferences live in this browser; Subscriptions edit data on the Miniflux server.
const NAV_GROUPS = [
  { key: "preferences", label: "settings.nav.preferences", hint: "settings.nav.preferences_hint" },
  { key: "server", label: "settings.nav.server", hint: "settings.nav.server_hint" },
]

const SECTIONS = [
  { key: "general", group: "preferences", icon: <IconStorage />, Panel: General },
  { key: "layout", group: "preferences", icon: <IconLayout />, Panel: Layout },
  { key: "reading", group: "preferences", icon: <IconEye />, Panel: Reading },
  { key: "appearance", group: "preferences", icon: <IconSkin />, Panel: Appearance },
  { key: "ai", group: "preferences", icon: <IconRobot />, Panel: Ai },
  {
    key: "hotkeys",
    group: "preferences",
    icon: <IconCommand />,
    Panel: Hotkeys,
    desktopOnly: true,
  },
  { key: "subscriptions", group: "server", icon: <IconUnorderedList />, Panel: Subscriptions },
]

export const DEFAULT_SETTINGS_SECTION = "general"

const SettingsTabs = ({ activeTab, onTabChange }) => {
  const { polyglot } = useStore(polyglotState)
  const { isBelowMedium } = useScreenWidth()

  const sections = SECTIONS.filter((section) => !(section.desktopOnly && isBelowMedium))
  const activeSection = sections.find((section) => section.key === activeTab) ?? sections[0]
  const { Panel } = activeSection

  return (
    <div className="settings-shell">
      {/* The hero dialogs' tinted band: the rail on desktop, the title + strip on phones. */}
      <div className="settings-band">
        {isBelowMedium ? (
          <div className="settings-mobile-title">{polyglot.t("sidebar.settings")}</div>
        ) : null}
        <nav aria-label={polyglot.t("sidebar.settings")} className="settings-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.key} className="settings-nav-group">
              <div className="settings-nav-label">
                {polyglot.t(group.label)}
                <span>{polyglot.t(group.hint)}</span>
              </div>
              {sections
                .filter((section) => section.group === group.key)
                .map((section) => {
                  const isActive = section.key === activeSection.key
                  return (
                    <button
                      key={section.key}
                      aria-current={isActive ? "page" : undefined}
                      className={classNames("settings-nav-item", { "is-active": isActive })}
                      type="button"
                      onClick={() => onTabChange(section.key)}
                    >
                      {section.icon}
                      <span>{polyglot.t(`settings.${section.key}`)}</span>
                    </button>
                  )
                })}
            </div>
          ))}
        </nav>
      </div>
      {/* Keyed so each section opens scrolled to the top. */}
      <SimpleBar key={activeSection.key} className="settings-pane">
        <div className="settings-pane-content">
          <header className="settings-pane-header">
            <div className="settings-pane-kicker">
              {polyglot.t(NAV_GROUPS.find((group) => group.key === activeSection.group).label)}
            </div>
            <h2>{polyglot.t(`settings.${activeSection.key}`)}</h2>
            <p>{polyglot.t(`settings.section.${activeSection.key}_description`)}</p>
          </header>
          <Panel />
        </div>
      </SimpleBar>
    </div>
  )
}

export default SettingsTabs
