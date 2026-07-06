import { Button, Divider, Dropdown, Menu, Modal, Radio } from "@arco-design/web-react"
import {
  IconBook,
  IconBranch,
  IconCalendarClock,
  IconCode,
  IconDesktop,
  IconExclamationCircle,
  IconGithub,
  IconInfoCircleFill,
  IconLink,
  IconMoonFill,
  IconPoweroff,
  IconRefresh,
  IconSettings,
  IconSunFill,
  IconUser,
} from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useNavigate } from "react-router"

import { polyglotState } from "@/hooks/useLanguage"
import useModalToggle from "@/hooks/useModalToggle"
import { authState, resetAuth } from "@/store/authState"
import { resetContent } from "@/store/contentState"
import { resetData } from "@/store/dataState"
import { resetFeedIcons } from "@/store/feedIconsState"
import { resetSettings, settingsState, updateSettings } from "@/store/settingsState"
import { GITHUB_REPO_PATH } from "@/utils/constants"
import { Notification } from "@/utils/feedback"
import buildInfo from "@/version-info.json"
import "./Profile.css"

export default function Profile() {
  const navigate = useNavigate()
  const { server } = useStore(authState)
  const { polyglot } = useStore(polyglotState)

  const { themeMode } = useStore(settingsState)

  const { setSettingsModalVisible } = useModalToggle()

  const buildVersion = buildInfo.buildVersion ?? buildInfo.gitHash ?? "local"
  const buildChannel = buildInfo.channel ?? "local"
  const buildCommit = buildInfo.gitHash ?? "unknown"
  const buildDate = buildInfo.gitCommitDate ?? buildInfo.gitDate ?? buildInfo.buildDate ?? "unknown"

  const handleResetSettings = () => {
    Modal.confirm({
      title: polyglot.t("sidebar.settings_reset_confirm"),
      content: <p>{polyglot.t("sidebar.settings_reset_description")}</p>,
      icon: <IconInfoCircleFill />,
      okButtonProps: { status: "danger" },
      onOk: () => resetSettings(),
    })
  }

  const handleLogout = () => {
    Modal.confirm({
      title: polyglot.t("sidebar.logout_confirm"),
      content: <p>{polyglot.t("sidebar.logout_description")}</p>,
      icon: <IconInfoCircleFill />,
      okButtonProps: { status: "danger" },
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
              <IconBook />
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
    <div className="user-profile-container">
      <div>
        <Dropdown
          position="br"
          trigger="click"
          droplist={
            <Menu>
              <Radio.Group
                name="theme"
                size="small"
                type="button"
                value={themeMode}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "8px",
                }}
                onChange={(value) => updateSettings({ themeMode: value })}
              >
                <Radio value="system">
                  <IconDesktop />
                </Radio>
                <Radio value="light">
                  <IconSunFill />
                </Radio>
                <Radio value="dark">
                  <IconMoonFill />
                </Radio>
              </Radio.Group>
              <Divider style={{ margin: "4px 0" }} />
              <Menu.Item key="0" onClick={() => setSettingsModalVisible(true)}>
                <IconSettings className="icon-right" />
                {polyglot.t("sidebar.settings")}
              </Menu.Item>
              <Menu.Item key="1" onClick={() => window.open(`${server}/settings`, "_blank")}>
                <IconLink className="icon-right" />
                {polyglot.t("sidebar.miniflux_settings")}
              </Menu.Item>
              <Menu.Item
                key="2"
                onClick={() =>
                  window.open(`https://github.com/${GITHUB_REPO_PATH}/issues`, "_blank")
                }
              >
                <IconExclamationCircle className="icon-right" />
                {polyglot.t("sidebar.report_issue")}
              </Menu.Item>
              <Divider style={{ margin: "4px 0" }} />
              <Menu.Item key="3" onClick={handleAbout}>
                <IconInfoCircleFill className="icon-right" />
                {polyglot.t("sidebar.about")}
              </Menu.Item>
              <Divider style={{ margin: "4px 0" }} />
              <Menu.Item key="4" onClick={handleResetSettings}>
                <IconRefresh className="icon-right" />
                {polyglot.t("sidebar.reset_settings")}
              </Menu.Item>
              <Menu.Item key="5" onClick={handleLogout}>
                <IconPoweroff className="icon-right" />
                {polyglot.t("sidebar.logout")}
              </Menu.Item>
            </Menu>
          }
        >
          <Button icon={<IconUser />} shape="circle" size="small" />
        </Dropdown>
      </div>
    </div>
  )
}
