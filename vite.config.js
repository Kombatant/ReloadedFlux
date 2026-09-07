/* eslint-disable import/extensions */
import path from "node:path"
import { fileURLToPath } from "node:url"

import viteReact from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

import { createVersionInfo, writeVersionInfo } from "./src/scripts/version-info.js"

const { dirname, resolve } = path
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const vendorChunks = {
  arco: ["@arco-design/web-react"],
  highlight: ["highlight.js"],
  react: ["react", "react-dom", "react-router"],
}

// Rolldown (Vite 8) only accepts the function form of manualChunks.
const manualChunks = (id) => {
  const segments = id.split("node_modules/")
  if (segments.length < 2) {
    return
  }

  const parts = segments.at(-1).split("/")
  const pkg = parts[0].startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0]

  return Object.keys(vendorChunks).find((chunk) => vendorChunks[chunk].includes(pkg))
}

const generateVersionInfo = () => ({
  name: "reloadedflux-version-info",
  buildStart() {
    writeVersionInfo(createVersionInfo())
  },
})

export default defineConfig({
  plugins: [
    generateVersionInfo(),
    viteReact(),
    VitePWA({
      registerType: "prompt",
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    dedupe: ["react", "react-dom", "react-router"],
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
  },
  build: {
    outDir: "build",
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
})
