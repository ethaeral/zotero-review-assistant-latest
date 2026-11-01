import { unregisterAllReviewMenus } from "./contextMenu"
import { AddonInitProps } from "./types/types"
import { unregisterAllColumns } from "./utils/columns.utils"
import { log } from "./utils/devtools"
import { setPluginInfo } from "./utils/pluginInfo"
import { setupMainWindow, teardownMainWindow } from "./windowLifecycle"

export async function init({ id, version, rootURI, referenceName, window }: AddonInitProps & { window?: Window }) {
    setPluginInfo({ id, version, rootURI, referenceName })

    const win = window ?? Zotero.getMainWindow()
    if (win) {
        await setupMainWindow(win)
    }
}

export async function onMainWindowLoad({ window }: { window: Window }) {
    await setupMainWindow(window)
}

export async function shutdown() {
    await log("index.ts: shutdown")
    for (const win of Zotero.getMainWindows()) {
        await teardownMainWindow(win)
    }
    unregisterAllReviewMenus()
    await unregisterAllColumns()
}

export async function onMainWindowUnload({ window }: { window: Window }) {
    await teardownMainWindow(window)
}
