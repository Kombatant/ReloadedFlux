import { Modal } from "@arco-design/web-react"

/**
 * The single confirmation dialog. Destructive actions (delete, reset,
 * overwrite) pass `danger` so the confirm button turns red; everything else
 * keeps the primary button. Title and content are already-translated strings
 * or nodes.
 */
const confirmAction = ({ title, content, onOk, danger = false, okText, cancelText }) =>
  Modal.confirm({
    title,
    content,
    okText,
    cancelText,
    okButtonProps: danger ? { status: "danger" } : undefined,
    onOk,
  })

export default confirmAction
