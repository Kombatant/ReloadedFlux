// TODO: Adjust this script to work with the new CI/CD pipeline
import { execSync } from "node:child_process"
import { writeFileSync } from "node:fs"

const safeExec = (command) => {
  try {
    return execSync(command, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim()
  } catch {
    return null
  }
}

const versionInfo = {
  gitHash: safeExec("git rev-parse --short HEAD") ?? "dev",
  gitDate: safeExec("git log -1 --format=%cd --date=iso") ?? new Date().toISOString(),
}

const versionInfoJson = JSON.stringify(versionInfo, null, 2)

writeFileSync("src/version-info.json", versionInfoJson)
writeFileSync("public/version-info.json", versionInfoJson)
