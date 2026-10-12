import { Tabs } from "@arco-design/web-react"
import {
  IconCommand,
  IconEye,
  IconFile,
  IconFolder,
  IconRobot,
  IconSkin,
  IconStorage,
  IconUnorderedList,
} from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import SimpleBar from "simplebar-react"

import { polyglotState } from "@/hooks/useLanguage"
import useScreenWidth from "@/hooks/useScreenWidth"

import Ai from "./Ai"
import Appearance from "./Appearance"
import ArticleDisplay from "./ArticleDisplay"
import CategoryList from "./CategoryList"
import FeedList from "./FeedList"
import General from "./General"
import Hotkeys from "./Hotkeys"
import Reading from "./Reading"

import "./SettingsTabs.css"

const CustomTabTitle = ({ icon, title }) => (
  <div className="settings-tab-title">
    {icon}
    <div>{title}</div>
  </div>
)

const SettingsTabs = ({ activeTab, onTabChange }) => {
  const { polyglot } = useStore(polyglotState)
  const { isBelowMedium } = useScreenWidth()

  return (
    <SimpleBar className="settings-tabs-scroll">
      <Tabs
        animation
        activeTab={activeTab}
        className="custom-tabs"
        tabPosition="top"
        onChange={onTabChange}
      >
        <Tabs.TabPane
          key="1"
          title={
            <CustomTabTitle icon={<IconUnorderedList />} title={polyglot.t("settings.feeds")} />
          }
        >
          <FeedList />
        </Tabs.TabPane>
        <Tabs.TabPane
          key="2"
          title={<CustomTabTitle icon={<IconFolder />} title={polyglot.t("settings.categories")} />}
        >
          <CategoryList />
        </Tabs.TabPane>
        <Tabs.TabPane
          key="3"
          title={<CustomTabTitle icon={<IconStorage />} title={polyglot.t("settings.general")} />}
        >
          <General />
        </Tabs.TabPane>
        <Tabs.TabPane
          key="4"
          title={<CustomTabTitle icon={<IconEye />} title={polyglot.t("settings.reading")} />}
        >
          <Reading />
        </Tabs.TabPane>
        <Tabs.TabPane
          key="5"
          title={
            <CustomTabTitle icon={<IconFile />} title={polyglot.t("settings.article_display")} />
          }
        >
          <ArticleDisplay />
        </Tabs.TabPane>
        <Tabs.TabPane
          key="6"
          title={<CustomTabTitle icon={<IconSkin />} title={polyglot.t("settings.appearance")} />}
        >
          <Appearance />
        </Tabs.TabPane>
        <Tabs.TabPane
          key="7"
          title={<CustomTabTitle icon={<IconRobot />} title={polyglot.t("settings.ai")} />}
        >
          <Ai />
        </Tabs.TabPane>
        {!isBelowMedium && (
          <Tabs.TabPane
            key="8"
            title={<CustomTabTitle icon={<IconCommand />} title={polyglot.t("settings.hotkeys")} />}
          >
            <Hotkeys />
          </Tabs.TabPane>
        )}
      </Tabs>
    </SimpleBar>
  )
}

export default SettingsTabs
