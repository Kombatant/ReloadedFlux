import { Button, Dropdown, Menu, Modal } from "@arco-design/web-react"
import {
  IconBranch,
  IconCalendarClock,
  IconCode,
  IconDesktop,
  IconExclamationCircle,
  IconGithub,
  IconInfoCircle,
  IconLaunch,
  IconLink,
  IconMoonFill,
  IconPoweroff,
  IconRefresh,
  IconSettings,
  IconSunFill,
} from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useState } from "react"
import { useNavigate } from "react-router"

import ReloadedFluxIcon from "@/components/icons/ReloadedFluxIcon"
import { AppMenu, AppMenuDivider, AppMenuItemContent } from "@/components/ui/AppMenu"
import { HeroDialogDetails, HeroDialogHeader, HeroDialogLinks } from "@/components/ui/HeroDialog"
import SegmentedControl from "@/components/ui/SegmentedControl"
import { polyglotState } from "@/hooks/useLanguage"
import useModalToggle from "@/hooks/useModalToggle"
import useScreenWidth from "@/hooks/useScreenWidth"
import { authState, resetAuth } from "@/store/authState"
import { resetContent } from "@/store/contentState"
import { resetData } from "@/store/dataState"
import { resetFeedIcons } from "@/store/feedIconsState"
import { resetSettings, settingsState, updateSettings } from "@/store/settingsState"
import confirmAction from "@/utils/confirm"
import { GITHUB_REPO_PATH } from "@/utils/constants"
import { Notification } from "@/utils/feedback"
import buildInfo from "@/version-info.json"
import "./Profile.css"

/** Layout picker: two preview cards that act as a radio group. */
const LayoutPicker = ({ label, value, options, onChange }) => (
  <fieldset className="profile-menu-preference">
    <legend>{label}</legend>
    <div className="profile-menu-layout-options">
      {options.map((option) => (
        <label key={option.value} className="profile-menu-layout-option">
          <input
            checked={value === option.value}
            name="profile-layout"
            type="radio"
            value={option.value}
            onChange={() => onChange(option.value)}
          />
          <span className="profile-menu-layout-card">
            <span
              aria-hidden="true"
              className={`profile-menu-layout-preview profile-menu-layout-preview-${option.value}`}
            >
              <span />
              <span />
              <span />
            </span>
            <span>{option.label}</span>
          </span>
        </label>
      ))}
    </div>
  </fieldset>
)

export default function Profile() {
  const navigate = useNavigate()
  const [menuVisible, setMenuVisible] = useState(false)
  const { server } = useStore(authState)
  const { polyglot } = useStore(polyglotState)

  const { layoutMode, themeMode } = useStore(settingsState)

  const { setSettingsModalVisible } = useModalToggle()
  const { isBelowMedium } = useScreenWidth()

  const buildVersion = buildInfo.buildVersion ?? buildInfo.gitHash ?? "local"
  const buildChannel = buildInfo.channel ?? "local"
  const buildCommit = buildInfo.gitHash ?? "unknown"
  const buildDate = buildInfo.gitCommitDate ?? buildInfo.gitDate ?? buildInfo.buildDate ?? "unknown"

  const handleResetSettings = () => {
    confirmAction({
      danger: true,
      title: polyglot.t("sidebar.settings_reset_confirm"),
      content: polyglot.t("sidebar.settings_reset_description"),
      onOk: () => resetSettings(),
    })
  }

  const handleLogout = () => {
    confirmAction({
      title: polyglot.t("sidebar.logout_confirm"),
      content: polyglot.t("sidebar.logout_description"),
      onOk: () => {
        resetAuth()
        resetContent()
        resetData()
        resetFeedIcons()
        navigate("/login")
        Notification.success({
          title: polyglot.t("sidebar.logout_success"),
        })
      },
    })
  }

  const handleAbout = () => {
    Modal.info({
      className: "hero-dialog",
      icon: null,
      title: null,
      content: (
        <>
          <HeroDialogHeader
            description={polyglot.t("about.description")}
            kicker={polyglot.t("about.kicker")}
            logo={<ReloadedFluxIcon />}
            title={
              <>
                <span className="hero-dialog-title-strong">Reloaded</span>Flux
              </>
            }
          />
          <HeroDialogLinks
            links={[
              {
                href: "https://github.com/Kombatant/ReloadedFlux",
                icon: <IconGithub />,
                label: polyglot.t("about.project_repository"),
              },
              {
                href: "https://github.com/electh/ReactFlux",
                icon: <IconLink />,
                label: polyglot.t("about.lineage"),
              },
              {
                href: `https://github.com/${GITHUB_REPO_PATH}/issues`,
                icon: <IconExclamationCircle />,
                label: polyglot.t("sidebar.report_issue"),
                wide: true,
                external: true,
              },
            ]}
          />
          <HeroDialogDetails
            label={polyglot.t("about.build_info")}
            items={[
              { icon: <IconCode />, label: polyglot.t("about.version"), value: buildVersion },
              { icon: <IconBranch />, label: polyglot.t("about.channel"), value: buildChannel },
              { icon: <IconGithub />, label: polyglot.t("about.commit"), value: buildCommit },
              {
                icon: <IconCalendarClock />,
                label: polyglot.t("about.build_date"),
                value: buildDate,
              },
            ]}
          />
        </>
      ),
      okText: polyglot.t("about.close"),
    })
  }

  return (
    <Dropdown
      // The mobile drawer clips popups mounted inside its content area.
      getPopupContainer={() => document.body}
      position="bl"
      trigger="click"
      droplist={
        <AppMenu className="profile-menu">
          <div className="profile-menu-appearance">
            <div className="profile-menu-heading">{polyglot.t("settings.appearance")}</div>
            <fieldset className="profile-menu-preference">
              <legend>{polyglot.t("sidebar.theme_label")}</legend>
              <SegmentedControl
                ariaLabel={polyglot.t("sidebar.theme_label")}
                className="profile-menu-theme"
                value={themeMode}
                options={[
                  {
                    value: "system",
                    icon: <IconDesktop />,
                    label: polyglot.t("sidebar.theme_system"),
                  },
                  {
                    value: "light",
                    icon: <IconSunFill />,
                    label: polyglot.t("sidebar.theme_light"),
                  },
                  {
                    value: "dark",
                    icon: <IconMoonFill />,
                    label: polyglot.t("sidebar.theme_dark"),
                  },
                ]}
                onChange={(value) => updateSettings({ themeMode: value })}
              />
            </fieldset>
            {/* Combined view is desktop-only; Content uses columns on smaller screens. */}
            {isBelowMedium ? null : (
              <LayoutPicker
                label={polyglot.t("sidebar.layout_label")}
                value={layoutMode}
                options={[
                  {
                    value: "classic",
                    label: polyglot.t("appearance.layout_mode_classic"),
                  },
                  {
                    value: "stream",
                    label: polyglot.t("appearance.layout_mode_stream"),
                  },
                ]}
                onChange={(value) => updateSettings({ layoutMode: value })}
              />
            )}
          </div>
          <AppMenuDivider />
          <Menu.Item key="settings" onClick={() => setSettingsModalVisible(true)}>
            <AppMenuItemContent icon={<IconSettings />}>
              {polyglot.t("sidebar.settings")}
            </AppMenuItemContent>
          </Menu.Item>
          <Menu.Item
            key="miniflux-settings"
            onClick={() => window.open(`${server}/settings`, "_blank")}
          >
            <AppMenuItemContent icon={<IconLink />} suffix={<IconLaunch />}>
              {polyglot.t("sidebar.miniflux_settings")}
            </AppMenuItemContent>
          </Menu.Item>
          <Menu.Item key="about" onClick={handleAbout}>
            <AppMenuItemContent icon={<IconInfoCircle />}>
              {polyglot.t("sidebar.about")}
            </AppMenuItemContent>
          </Menu.Item>
          <AppMenuDivider />
          <Menu.Item key="logout" onClick={handleLogout}>
            <AppMenuItemContent icon={<IconPoweroff />}>
              {polyglot.t("sidebar.logout")}
            </AppMenuItemContent>
          </Menu.Item>
          <Menu.Item key="reset-settings" onClick={handleResetSettings}>
            <AppMenuItemContent danger icon={<IconRefresh />}>
              {polyglot.t("sidebar.reset_settings")}
            </AppMenuItemContent>
          </Menu.Item>
        </AppMenu>
      }
      onVisibleChange={setMenuVisible}
    >
      <Button
        aria-expanded={menuVisible}
        aria-haspopup="menu"
        aria-label={polyglot.t("sidebar.profile_menu")}
        className="profile-menu-trigger"
        icon={<ReloadedFluxIcon />}
        // eslint-disable-next-line no-restricted-syntax -- the brand mark has its own trigger style
        shape="circle"
        title={polyglot.t("sidebar.profile_menu")}
      />
    </Dropdown>
  )
}
