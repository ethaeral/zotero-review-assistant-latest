import { createElement } from "react"
import { createRoot, Root } from "react-dom/client"

import { Addon } from "./addon"
import { registerExtraColumns } from "./extraColumns"
import { registerReviewContextMenu, unregisterReviewContextMenu } from "./contextMenu"
import { refreshItemTreeColumns } from "./utils/columns.utils"
import { log } from "./utils/devtools"
import { usePreferencesPanelReact } from "./utils/hooks/preferences"
import { getPluginInfo } from "./utils/pluginInfo"
import { ensurePluginWindowApi } from "./utils/pluginWindowApi"

const setupWindows = new WeakSet<Window>()
const reactRoots = new WeakMap<Window, Root>()
let preferencesRegistered = false

function loadAddonFluent(win: Window, rootURI: string) {
    const ftlHref = rootURI + "assets/locale/en-US/addon.ftl"
    const mozXUL = win.MozXULElement as typeof win.MozXULElement & {
        insertFTLIfNeeded?: (href: string) => void
    }
    mozXUL?.insertFTLIfNeeded?.(ftlHref)
}

export async function setupMainWindow(win: Window) {
    const { id, referenceName, rootURI } = getPluginInfo()
    ensurePluginWindowApi(win)

    loadAddonFluent(win, rootURI)

    await registerExtraColumns(id)
    await refreshItemTreeColumns()
    await registerReviewContextMenu(win)

    if (!preferencesRegistered) {
        await usePreferencesPanelReact({
            id: "main",
            label: "Zotero Review Assistant",
            image: "assets/icons/favicon.svg",
            stylesheets: ["styles/styles.css"],
        })
        preferencesRegistered = true
    }

    if (setupWindows.has(win)) {
        return
    }

    const appId = referenceName + "-app"
    if (!win.document.getElementById(appId)) {
        const appElement = win.document.createElement("div")
        appElement.id = appId
        win.document.documentElement.appendChild(appElement)
        const root = createRoot(appElement)
        reactRoots.set(win, root)
        root.render(createElement(Addon))
    }

    setupWindows.add(win)
    await log("setupMainWindow complete for", referenceName)
}

export async function teardownMainWindow(win: Window) {
    unregisterReviewContextMenu(win)

    const { referenceName } = getPluginInfo()
    const appId = referenceName + "-app"
    const root = reactRoots.get(win)
    if (root) {
        root.unmount()
        reactRoots.delete(win)
    }
    win.document.getElementById(appId)?.remove()
    setupWindows.delete(win)
}

export function resetPreferencesRegistrationForTests() {
    preferencesRegistered = false
}
