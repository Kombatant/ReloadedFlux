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
      className: "about-modal",
      icon: null,
      title: null,
      content: (
        <div className="about-modal-content">
          <div className="about-modal-header">
            <div aria-hidden="true" className="about-modal-logo">
              <ReloadedFluxIcon />
            </div>
            <div className="about-modal-heading">
              <div className="about-modal-kicker">About</div>
              <h2>
                <span className="about-modal-title-strong">Reloaded</span>Flux
              </h2>
              <p>
                A polished web client for Miniflux, maintained by Pete &quot;Kombatant&quot;
                Vagiakos.
              </p>
            </div>
          </div>

          <div className="about-modal-actions">
            <a
              className="about-modal-action"
              href="https://github.com/Kombatant/ReloadedFlux"
              rel="noopener noreferrer"
              target="_blank"
            >
              <IconGithub />
              Project repository
            </a>
            <a
              className="about-modal-action"
              href="https://github.com/electh/ReactFlux"
              rel="noopener noreferrer"
              target="_blank"
            >
              <IconLink />
              ReactFlux lineage
            </a>
            <a
              className="about-modal-action about-modal-report-issue"
              href={`https://github.com/${GITHUB_REPO_PATH}/issues`}
              rel="noopener noreferrer"
              target="_blank"
            >
              <IconExclamationCircle />
              {polyglot.t("sidebar.report_issue")}
              <IconLaunch className="about-modal-external-icon" />
            </a>
          </div>

          <div aria-label="Build information" className="about-modal-details">
            <div className="about-modal-detail">
              <IconCode />
              <span>Version</span>
              <strong>{buildVersion}</strong>
            </div>
            <div className="about-modal-detail">
              <IconBranch />
              <span>Channel</span>
              <strong>{buildChannel}</strong>
            </div>
            <div className="about-modal-detail">
              <IconGithub />
              <span>Commit</span>
              <strong>{buildCommit}</strong>
            </div>
            <div className="about-modal-detail">
              <IconCalendarClock />
              <span>Build date</span>
              <strong>{buildDate}</strong>
            </div>
          </div>
        </div>
      ),
      okText: "OK",
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
        shape="circle"
        title={polyglot.t("sidebar.profile_menu")}
      />
    </Dropdown>
  )
}
