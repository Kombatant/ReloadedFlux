// Pure: this module only decides which entries are duplicates. Marking them as
// read is a side effect owned by the caller, which keeps utils/ free of api and
// hook imports (those edges previously formed two import cycles).
//
// Returns { entries, duplicates } where `entries` preserves the original order
// and `duplicates` are the entries that were dropped.
const removeDuplicateEntries = (entries, option) => {
  if (entries.length === 0 || option === "none") {
    return { entries, duplicates: [] }
  }

  const originalOrder = entries.map((entry, index) => ({
    id: entry.id,
    index,
  }))

  const seenHashes = new Map()
  const seenTitles = new Map()
  const seenURLs = new Map()
  const duplicateEntries = []

  const uniqueEntries = [...entries]
    .toSorted((a, b) => a.id - b.id)
    .filter((entry) => {
      const { hash, title, url, id } = entry

      switch (option) {
        case "hash": {
          if (seenHashes.has(hash)) {
            duplicateEntries.push(entry)
            return false
          }
          seenHashes.set(hash, id)
          break
        }
        case "title": {
          if (seenTitles.has(title)) {
            duplicateEntries.push(entry)
            return false
          }
          seenTitles.set(title, id)
          break
        }
        case "url": {
          if (seenURLs.has(url)) {
            duplicateEntries.push(entry)
            return false
          }
          seenURLs.set(url, id)
          break
        }
        default: {
          return true
        }
      }
      return true
    })

  return {
    entries: uniqueEntries.toSorted((a, b) => {
      const indexA = originalOrder.find((order) => order.id === a.id).index
      const indexB = originalOrder.find((order) => order.id === b.id).index
      return indexA - indexB
    }),
    duplicates: duplicateEntries,
  }
}

export default removeDuplicateEntries
