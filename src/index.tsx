import { createRoot } from "react-dom/client"

import Addon from "./addon"
import { unregisterAllReviewMenus } from "./contextMenu"
import { AddonInitProps } from "./types/types"
import { unregisterAllColumns } from "./utils/columns.utils"
import { log } from "./utils/devtools"
import { getPluginInfo, setPluginInfo } from "./utils/pluginInfo"
import { setupMainWindow, teardownMainWindow } from "./windowLifecycle"

export async function init({ id, version, rootURI, referenceName }: AddonInitProps) {
    setPluginInfo({ id, version, rootURI, referenceName })

    const win = Zotero.getMainWindow()
    if (win) {
        await setupMainWindow(win)
    }
}

export async function onMainWindowLoad({ window }: { window: Window }) {
    await setupMainWindow(window)
}

export async function shutdown() {
    await log("index.ts: shutdown")
    unregisterAllReviewMenus()
    await unregisterAllColumns()

    const { referenceName } = getPluginInfo()
    for (const win of Zotero.getMainWindows()) {
        win.document.getElementById(referenceName + "-app")?.remove()
    }
}

export async function onMainWindowUnload({ window }: { window: Window }) {
    await teardownMainWindow(window)
}
