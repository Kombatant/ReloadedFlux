import { Input, Select, Tooltip } from "@arco-design/web-react"
import { IconQuestionCircle } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { Fragment, memo } from "react"

import { polyglotState } from "@/hooks/useLanguage"
import { setFilterType } from "@/store/contentState"
import draftFilterTypeState from "@/store/searchBarState"

const SearchForm = memo(({ value, onConfirm, onChange }) => {
  const draftFilterType = useStore(draftFilterTypeState)
  const { polyglot } = useStore(polyglotState)
  const tooltipLines = polyglot.t("search.tooltip").split("\n")

  const handleConfirm = () => {
    setFilterType(draftFilterType)
    onConfirm?.(value)
  }

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleConfirm()
    }
  }

  return (
    <div className="search-modal-content">
      <Input.Search
        allowClear
        placeholder={polyglot.t("search.placeholder")}
        value={value}
        addBefore={
          <Select
            style={{ width: "auto" }}
            value={draftFilterType}
            triggerProps={{
              autoAlignPopupWidth: false,
              autoAlignPopupMinWidth: true,
              position: "bl",
            }}
            onChange={(v) => draftFilterTypeState.set(v)}
          >
            <Select.Option value="title">{polyglot.t("search.type_title")}</Select.Option>
            <Select.Option value="content">{polyglot.t("search.type_content")}</Select.Option>
            <Select.Option value="author">{polyglot.t("search.type_author")}</Select.Option>
          </Select>
        }
        prefix={
          <Tooltip
            mini
            content={
              <div>
                {tooltipLines.map((line, index) => (
                  <Fragment key={`tooltip-line-${index}`}>
                    {line}
                    {index < tooltipLines.length - 1 && <br />}
                  </Fragment>
                ))}
              </div>
            }
          >
            <IconQuestionCircle />
          </Tooltip>
        }
        onChange={onChange}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
})
SearchForm.displayName = "SearchForm"

export default SearchForm
