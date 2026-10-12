import { Space, Tag } from "@arco-design/web-react"
import { IconPlus, IconRefresh } from "@arco-design/web-react/icon"
import { useStore } from "@nanostores/react"
import { useEffect, useRef, useState } from "react"

import IconButton from "@/components/ui/IconButton"
import { polyglotState } from "@/hooks/useLanguage"
import { duplicateHotkeysState, resetHotkey, updateHotkey } from "@/store/hotkeysState"

import EditableTag from "./EditableTag"

const capitalizeFirstLetter = (word) => word.charAt(0).toUpperCase() + word.slice(1)

const processKeyName = (keys) =>
  keys
    .map((key) => {
      const modifiedKey = key
        .replace("left", "←")
        .replace("right", "→")
        .replace("up", "↑")
        .replace("down", "↓")
      return modifiedKey.includes("+")
        ? modifiedKey
            .split("+")
            .map((k) => capitalizeFirstLetter(k))
            .join(" + ")
        : capitalizeFirstLetter(modifiedKey)
    })
    .join(" / ")

const EditableTagGroup = ({ keys, record }) => {
  const duplicateHotkeys = useStore(duplicateHotkeysState)
  const { polyglot } = useStore(polyglotState)

  const [isEditing, setIsEditing] = useState(false)

  const groupRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (groupRef.current && !groupRef.current.contains(event.target)) {
        setIsEditing(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (!isEditing) {
      const newKeys = keys.filter((key) => key !== "")
      if (newKeys.length !== keys.length) {
        updateHotkey(record.action, newKeys)
      }
    }
  }, [isEditing, keys, record.action])

  return (
    <div ref={groupRef}>
      {isEditing ? (
        <Space wrap className="hotkey-tag-group">
          {keys.map((key, keyIndex) => (
            <EditableTag
              key={`${record.action}-${key}`}
              editOnMount={key === ""}
              value={key}
              onChange={(newKey) => {
                const newKeys = [...keys]
                newKeys[keyIndex] = newKey
                updateHotkey(record.action, newKeys)
              }}
              onRemove={() => {
                const newKeys = keys.filter((_, filterIndex) => filterIndex !== keyIndex)
                updateHotkey(record.action, newKeys)
              }}
            />
          ))}
          <Tag
            className="app-add-tag"
            icon={<IconPlus />}
            onClick={() => {
              const newKeys = [...keys, ""]
              updateHotkey(record.action, newKeys)
            }}
          />
          <IconButton
            icon={<IconRefresh />}
            label={polyglot.t("hotkeys.reset_tooltip")}
            size="sm"
            onClick={() => resetHotkey(record.action)}
          />
        </Space>
      ) : (
        <Tag
          className="hotkey-tag"
          color={keys.some((key) => duplicateHotkeys.includes(key)) ? "red" : undefined}
          onClick={() => setIsEditing(true)}
        >
          {processKeyName(keys)}
        </Tag>
      )}
    </div>
  )
}

export default EditableTagGroup
