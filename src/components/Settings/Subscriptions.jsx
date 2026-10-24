import { Button } from "@arco-design/web-react"
import { IconDownload, IconLaunch, IconUpload } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useRef, useState } from "react"

import { exportOPML, importOPML } from "@/apis"
import { polyglotState } from "@/hooks/useLanguage"
import { authState } from "@/store/authState"
import { Notification } from "@/utils/feedback"
import { downloadFile, readFileAsText } from "@/utils/file"

import CategoryList from "./CategoryList"
import FeedList from "./FeedList"
import SettingItem from "./SettingItem"
import SettingsSection from "./SettingsSection"

const Subscriptions = () => {
  const { server } = useStore(authState)
  const { polyglot } = useStore(polyglotState)
  const [importing, setImporting] = useState(false)
  const opmlInputRef = useRef(null)

  const handleOpmlExport = async () => {
    try {
      const opmlContent = await exportOPML()
      downloadFile(opmlContent, "feeds.opml", "text/xml")
      Notification.success({ title: polyglot.t("sidebar.export_opml_success") })
    } catch {
      Notification.error({ title: polyglot.t("sidebar.export_opml_error") })
    }
  }

  const handleOpmlImport = async (e) => {
    const file = e.target.files[0]
    e.target.value = ""

    if (!file) {
      return
    }
    setImporting(true)
    try {
      const fileContent = await readFileAsText(file)
      const response = await importOPML(fileContent)
      if (response.status === 201) {
        Notification.success({ title: polyglot.t("sidebar.import_opml_success") })
      } else {
        Notification.error({ title: polyglot.t("sidebar.import_opml_error") })
      }
    } catch (error) {
      Notification.error({
        title: polyglot.t("sidebar.import_opml_error"),
        content: error.message,
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <SettingsSection plain title={polyglot.t("settings.categories")}>
        <CategoryList />
      </SettingsSection>

      <SettingsSection plain title={polyglot.t("settings.group.feeds")}>
        <FeedList />
      </SettingsSection>

      <SettingsSection title={polyglot.t("settings.group.opml")}>
        <SettingItem title={polyglot.t("settings.content.import_export_label")}>
          <div className="setting-row-actions">
            <Button
              disabled={importing}
              icon={<IconUpload />}
              onClick={() => opmlInputRef.current?.click()}
            >
              {polyglot.t("sidebar.import_opml")}
            </Button>
            <input
              ref={opmlInputRef}
              accept=".opml,.xml"
              disabled={importing}
              style={{ display: "none" }}
              type="file"
              onChange={handleOpmlImport}
            />
            <Button icon={<IconDownload />} onClick={handleOpmlExport}>
              {polyglot.t("sidebar.export_opml")}
            </Button>
          </div>
        </SettingItem>
      </SettingsSection>

      <SettingsSection>
        <SettingItem
          description={polyglot.t("settings.miniflux_settings_description")}
          title={polyglot.t("sidebar.miniflux_settings")}
        >
          <Button icon={<IconLaunch />} onClick={() => window.open(`${server}/settings`, "_blank")}>
            {polyglot.t("settings.open_link")}
          </Button>
        </SettingItem>
      </SettingsSection>
    </>
  )
}

export default Subscriptions
