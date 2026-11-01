import defaultPreferences from "./utils/prefs.default"
import { useKeyboardShortcutManager, usePref } from "./utils/hooks"

import { usePrefStateFunction } from "./types/types"
import { ArticleStatus } from "./types/addon"

import { setItemStatus } from "./utils/columns.utils"
import { useEffect, useRef } from "react"
import StatusView, { StatusViewComponent } from "./views/statusView"
import PRISMAView, { PRISMAViewComponent } from "./views/prismaView"
import { getPluginInfo } from "./utils/pluginInfo"
import { ensurePluginWindowApi } from "./utils/pluginWindowApi"
import { registerReviewContextMenu } from "./contextMenu"

export function Addon() {
    const [statusList] = usePref("statusList", defaultPreferences.statusList, { parseJSON: true, observe: true }) as [
        ArticleStatus[],
        usePrefStateFunction,
    ]

    const statusViewRef = useRef<StatusViewComponent>(null)
    const prismaViewRef = useRef<PRISMAViewComponent>(null)

    useEffect(() => {
        const win = Zotero.getMainWindow()
        const api = ensurePluginWindowApi(win)
        api.editStatus = () => statusViewRef.current?.edit()
        api.generatePRISMADiagram = () => prismaViewRef.current?.open()
    }, [])

    useEffect(() => {
        const win = Zotero.getMainWindow()
        registerReviewContextMenu(win)
    }, [statusList])

    useKeyboardShortcutManager(
        statusList
            .filter((status) => status.keystroke != null)
            .map((status) => ({
                keystroke: status.keystroke!,
                callback: () => setItemStatus(statusList, status),
            })),
        [statusList],
    )

    return (
        <>
            <StatusView ref={statusViewRef} />
            <PRISMAView ref={prismaViewRef} />
            <link rel="stylesheet" type="text/css" href={`${getPluginInfo().rootURI}/styles/styles.css`} />
        </>
    )
}

