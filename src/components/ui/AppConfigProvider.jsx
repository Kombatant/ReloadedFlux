import { ConfigProvider } from "@arco-design/web-react"
import deDE from "@arco-design/web-react/es/locale/de-DE"
import enUS from "@arco-design/web-react/es/locale/en-US"
import esES from "@arco-design/web-react/es/locale/es-ES"
import frFR from "@arco-design/web-react/es/locale/fr-FR"
import zhCN from "@arco-design/web-react/es/locale/zh-CN"
import { useStore } from "@nanostores/react"

import { settingsState } from "@/store/settingsState"

// Arco ships no Greek locale, so el-GR falls back to English.
const localeMap = {
  "de-DE": deDE,
  "en-CA": enUS,
  "es-ES": esES,
  "fr-FR": frFR,
  "zh-CN": zhCN,
}

/** The one Arco ConfigProvider for every route (app shell, login, error page). */
const AppConfigProvider = ({ children }) => {
  const { language } = useStore(settingsState)

  return <ConfigProvider locale={localeMap[language] || enUS}>{children}</ConfigProvider>
}

export default AppConfigProvider
