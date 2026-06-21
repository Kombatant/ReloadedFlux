import { hotkeysState } from "@/store/hotkeysState"
import { settingsState } from "@/store/settingsState"
import { expandedCategoriesState } from "@/store/sidebarState"
import { pickExportableSettings, sanitizeSettings } from "@/utils/settings-transfer/settings-config"
import { buildSettingsExportXmlFromSnapshot } from "@/utils/settings-transfer/settings-transfer-core"

export {
  buildSettingsExportXmlFromSnapshot,
  formatSettingsExportFilename,
  parseSettingsImportXml,
} from "@/utils/settings-transfer/settings-transfer-core"

export const getExportableSettingsSnapshot = () => ({
  settings: pickExportableSettings(sanitizeSettings(settingsState.get())),
  hotkeys: hotkeysState.get(),
  expandedCategories: expandedCategoriesState.get(),
})

export const buildSettingsExportXml = () =>
  buildSettingsExportXmlFromSnapshot(getExportableSettingsSnapshot())
