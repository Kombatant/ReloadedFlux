import { Button, Select } from "@arco-design/web-react"
import { IconDownload, IconRefresh, IconUpload } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useRef, useState } from "react"

import { polyglotState } from "@/hooks/useLanguage"
import { replaceHotkeys } from "@/store/hotkeysState"
import {
  replaceSettingsPreservingAi,
  resetSettings,
  settingsState,
  updateSettings,
} from "@/store/settingsState"
import { replaceExpandedCategories } from "@/store/sidebarState"
import confirmAction from "@/utils/confirm"
import { Notification } from "@/utils/feedback"
import { downloadFile, readFileAsText } from "@/utils/file"
import {
  buildSettingsExportXml,
  formatSettingsExportFilename,
  parseSettingsImportXml,
} from "@/utils/settings-transfer"

import SettingItem from "./SettingItem"
import SettingsSection from "./SettingsSection"

const languageOptions = [
  { label: "English", value: "en-CA" },
  { label: "Deutsch", value: "de-DE" },
  { label: "Español", value: "es-ES" },
  { label: "Français", value: "fr-FR" },
  { label: "简体中文", value: "zh-CN" },
  { label: "Ελληνικά", value: "el-GR" },
]

const General = () => {
  const { homePage, language } = useStore(settingsState)
  const { polyglot } = useStore(polyglotState)
  const [importingSettings, setImportingSettings] = useState(false)
  const importInputRef = useRef(null)

  const homePageOptions = [
    { label: polyglot.t("settings.default_home_page_option_all"), value: "all" },
    { label: polyglot.t("settings.default_home_page_option_today"), value: "today" },
    { label: polyglot.t("settings.default_home_page_option_starred"), value: "starred" },
    { label: polyglot.t("settings.default_home_page_option_history"), value: "history" },
  ]

  const handleSettingsExport = () => {
    try {
      const xmlContent = buildSettingsExportXml()
      downloadFile(xmlContent, formatSettingsExportFilename(), "application/xml")
      Notification.success({ title: polyglot.t("settings.settings_export_success") })
    } catch (error) {
      Notification.error({
        title: polyglot.t("settings.settings_export_error"),
        content: error.message,
      })
    }
  }

  const applyImportedSettings = ({ settings, hotkeys, expandedCategories }) => {
    replaceSettingsPreservingAi(settings)
    replaceHotkeys(hotkeys)
    replaceExpandedCategories(expandedCategories)

    Notification.success({
      title: polyglot.t("settings.settings_import_success"),
      content: polyglot.t("settings.settings_import_reload_notice"),
    })

    globalThis.setTimeout(() => {
      globalThis.location.reload()
    }, 250)
  }

  const handleResetSettings = () => {
    confirmAction({
      danger: true,
      title: polyglot.t("sidebar.settings_reset_confirm"),
      content: polyglot.t("sidebar.settings_reset_description"),
      onOk: () => resetSettings(),
    })
  }

  const handleSettingsImport = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) {
      return
    }

    setImportingSettings(true)

    try {
      const fileContent = await readFileAsText(file)
      const importedSnapshot = parseSettingsImportXml(fileContent)

      confirmAction({
        danger: true,
        title: polyglot.t("settings.settings_import_confirm"),
        content: (
          <div>
            <p>{polyglot.t("settings.settings_import_description")}</p>
            <p>{polyglot.t("settings.settings_import_ai_notice")}</p>
          </div>
        ),
        onOk: () => applyImportedSettings(importedSnapshot),
      })
    } catch (error) {
      Notification.error({
        title: polyglot.t("settings.settings_import_error"),
        content: error.message,
      })
    } finally {
      setImportingSettings(false)
    }
  }

  return (
    <>
      <SettingsSection>
        <SettingItem
          description={polyglot.t("appearance.language_description")}
          title={polyglot.t("appearance.language_label")}
        >
          <Select
            className="input-select"
            getPopupContainer={() => document.body}
            value={language}
            onChange={(value) => updateSettings({ language: value })}
          >
            {languageOptions.map(({ label, value }) => (
              <Select.Option key={value} value={value}>
                {label}
              </Select.Option>
            ))}
          </Select>
        </SettingItem>

        <SettingItem
          description={polyglot.t("settings.default_home_page_description")}
          title={polyglot.t("settings.default_home_page_label")}
        >
          <Select
            className="input-select"
            getPopupContainer={() => document.body}
            value={homePage}
            onChange={(value) => updateSettings({ homePage: value })}
          >
            {homePageOptions.map(({ label, value }) => (
              <Select.Option key={value} value={value}>
                {label}
              </Select.Option>
            ))}
          </Select>
        </SettingItem>
      </SettingsSection>

      <SettingsSection
        note={polyglot.t("settings.group.backup_note")}
        title={polyglot.t("settings.group.backup")}
      >
        <SettingItem
          description={polyglot.t("settings.settings_transfer_description")}
          title={polyglot.t("settings.settings_transfer_label")}
        >
          <div className="setting-row-actions">
            <Button
              disabled={importingSettings}
              icon={<IconUpload />}
              onClick={() => importInputRef.current?.click()}
            >
              {polyglot.t("settings.import_settings")}
            </Button>
            <input
              ref={importInputRef}
              accept=".xml"
              disabled={importingSettings}
              style={{ display: "none" }}
              type="file"
              onChange={handleSettingsImport}
            />
            <Button icon={<IconDownload />} onClick={handleSettingsExport}>
              {polyglot.t("settings.export_settings")}
            </Button>
          </div>
        </SettingItem>

        <SettingItem
          description={polyglot.t("settings.reset_settings_description")}
          title={polyglot.t("sidebar.reset_settings")}
        >
          <Button icon={<IconRefresh />} status="danger" onClick={handleResetSettings}>
            {polyglot.t("sidebar.reset_settings")}
          </Button>
        </SettingItem>
      </SettingsSection>
    </>
  )
}

export default General
