// External Dependencies
import { createRoot } from "react-dom/client"

// Internal Dependencies
import { setPluginInfo } from "./utils/pluginInfo"
import PreferencePane from "./views/preferencesView"

// Devtools
import { log } from "./utils/devtools"

const MAX_INIT_ATTEMPTS = 30
const INIT_RETRY_MS = 100

function readPluginInfoFromDom(): {
    id: string
    version: string
    rootURI: string
    referenceName: string
} | null {
    const container = document.querySelector("[data-plugin-id][data-plugin-referencename]")
    if (!container) {
        return null
    }

    const id = container.getAttribute("data-plugin-id")
    const version = container.getAttribute("data-plugin-version")
    const rootURI = container.getAttribute("data-plugin-rooturi")
    const referenceName = container.getAttribute("data-plugin-referencename")

    if (!id || !version || !rootURI || !referenceName) {
        return null
    }

    return { id, version, rootURI, referenceName }
}

function initPreferencesPane(attempt = 0) {
    const pluginInfo = readPluginInfoFromDom()
    if (!pluginInfo) {
        if (attempt >= MAX_INIT_ATTEMPTS) {
            Zotero.logError(new Error("Zotero Review Assistant: preferences pane container not found"))
            return
        }
        window.setTimeout(() => initPreferencesPane(attempt + 1), INIT_RETRY_MS)
        return
    }

    setPluginInfo(pluginInfo)

    const app = document.querySelector(`[data-plugin-id="${pluginInfo.id}"] #app`) as HTMLElement | null
    if (!app) {
        if (attempt >= MAX_INIT_ATTEMPTS) {
            Zotero.logError(new Error("Zotero Review Assistant: preferences pane #app mount point not found"))
            return
        }
        window.setTimeout(() => initPreferencesPane(attempt + 1), INIT_RETRY_MS)
        return
    }

    document.querySelector("window")?.addEventListener("beforeunload", () => {
        log("Unloading Preferences Pane")
    })

    log("Initializing Preferences Pane", app)

    const root = createRoot(app)
    root.render(<PreferencePane />)
}

initPreferencesPane()
