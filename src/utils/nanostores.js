const createSetter =
  (store, key = null) =>
  (updater) => {
    const state = store.get()

    if (typeof state === "object" && state !== null) {
      if (key === null) {
        return
      }
      const next = typeof updater === "function" ? updater(state[key]) : updater
      // Skip no-op writes: re-setting an equal value would still create a new
      // state object and notify every subscriber, which lets effects that write
      // back the same value cascade into infinite update loops (React #185).
      if (Object.is(state[key], next)) {
        return
      }
      store.set({ ...state, [key]: next })
    } else {
      const next = typeof updater === "function" ? updater(state) : updater
      if (Object.is(state, next)) {
        return
      }
      store.set(next)
    }
  }

export default createSetter
