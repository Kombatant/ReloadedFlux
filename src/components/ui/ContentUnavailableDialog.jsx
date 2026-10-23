import { Modal } from "@arco-design/web-react"
import { IconCloudDownload, IconLink } from "@arco-design/web-react/icon"

import { HeroDialogHeader, HeroDialogLinks } from "@/components/ui/HeroDialog"
import "./ContentUnavailableDialog.css"

const showContentUnavailableDialog = (entry, polyglot) => {
  let articleUrl
  try {
    const url = new URL(entry.url)
    if (url.protocol === "http:" || url.protocol === "https:") {
      articleUrl = url
    }
  } catch {
    // Keep the explanation available even if the feed supplied an invalid URL.
  }

  return Modal.info({
    className: "hero-dialog content-unavailable-dialog",
    icon: null,
    title: polyglot.t("actions.full_content_unavailable_title"),
    content: (
      <>
        <HeroDialogHeader
          description={polyglot.t("actions.full_content_unavailable_description")}
          logo={<IconCloudDownload />}
          logoVariant="inverse"
          title={polyglot.t("actions.full_content_unavailable_title")}
        />
        {articleUrl ? (
          <HeroDialogLinks
            links={[
              {
                href: articleUrl.href,
                icon: <IconLink />,
                label: articleUrl.hostname,
                wide: true,
                external: true,
              },
            ]}
          />
        ) : null}
      </>
    ),
    okText: polyglot.t("actions.full_content_unavailable_close"),
    okButtonProps: { autoFocus: true },
    focusLock: true,
    escToExit: true,
    maskClosable: false,
  })
}

export default showContentUnavailableDialog
