import { attributesToProps } from "html-react-parser"

const attributeAliases = {
  allowfullscreen: "allowFullScreen",
  frameborder: "frameBorder",
  referrerpolicy: "referrerPolicy",
}

const htmlAttributesToProps = (attributes = {}, nodeName) => {
  const props = attributesToProps(attributes, nodeName)

  for (const [attributeName, propName] of Object.entries(attributeAliases)) {
    if (attributeName in attributes) {
      props[propName] = attributes[attributeName]
      delete props[attributeName]
    }
  }

  return props
}

export default htmlAttributesToProps
