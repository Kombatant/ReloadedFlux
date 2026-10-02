/**
 * Reloads the page onto the newest deployed build.
 *
 * The PWA registers its service worker in "prompt" mode, so a new build's
 * worker installs but then waits behind the current one, and a plain reload
 * keeps serving the old precached assets. Before reloading, ask the
 * registration to look for a new worker, tell the waiting one to take over
 * (the Workbox worker listens for SKIP_WAITING), and wait for it to control
 * the page. Every step is bounded so a slow or missing worker still ends in a
 * reload.
 */

const SW_STEP_TIMEOUT_MS = 5000

const withTimeout = (promise) =>
  Promise.race([
    promise,
    new Promise((resolve) => {
      setTimeout(resolve, SW_STEP_TIMEOUT_MS)
    }),
  ])

const waitForInstalled = (worker) =>
  new Promise((resolve) => {
    if (worker.state === "installed" || worker.state === "activated") {
      resolve()
      return
    }

    worker.addEventListener("statechange", () => {
      if (worker.state === "installed" || worker.state === "redundant") {
        resolve()
      }
    })
  })

const waitForControllerChange = () =>
  new Promise((resolve) => {
    navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true })
  })

const activateLatestServiceWorker = async () => {
  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration) {
    return
  }

  await withTimeout(registration.update())

  if (registration.installing) {
    await withTimeout(waitForInstalled(registration.installing))
  }

  const { waiting } = registration
  if (!waiting) {
    return
  }

  const controllerChanged = waitForControllerChange()
  waiting.postMessage({ type: "SKIP_WAITING" })
  await withTimeout(controllerChanged)
}

const reloadToLatestBuild = async () => {
  if ("serviceWorker" in navigator) {
    try {
      await activateLatestServiceWorker()
    } catch (error) {
      console.error("Failed to activate the latest service worker:", error)
    }
  }

  globalThis.location.reload()
}

export default reloadToLatestBuild
