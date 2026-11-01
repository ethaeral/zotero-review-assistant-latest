import { ArticleStatus } from "./types/addon"
import { MenuItem } from "./types/types"
import { setItemStatus } from "./utils/columns.utils"
import defaultPreferences from "./utils/prefs.default"
import { generateMenuIcon } from "./utils/helpers"
import { generateMenuDOM } from "./utils/hooks/menu"
import { getPluginInfo } from "./utils/pluginInfo"
import { getZoteroPref } from "./utils/prefs"
import { JSONFromString } from "./utils/utils"

const ZRA_MENU_ATTR = "data-zra-menu"
const LIBRARY_ITEM_REVIEW_MENU_ID = "zra-library-item-review"

type LibraryMenuData = _ZoteroTypes.MenuManager.MenuData<_ZoteroTypes.MenuManager.LibraryMenuContext>

type PluginWindowApi = {
    editStatus?: () => void
    generatePRISMADiagram?: () => void
}

let registeredMenuManagerId: string | null = null

function getMenuManager(): _ZoteroTypes.MenuManager | undefined {
    return (Zotero as typeof Zotero & { MenuManager?: _ZoteroTypes.MenuManager }).MenuManager
}

function getStatusList(): ArticleStatus[] {
    const raw = getZoteroPref("statusList")
    if (!raw) {
        return defaultPreferences.statusList
    }
    return JSONFromString(raw as string, defaultPreferences.statusList) as ArticleStatus[]
}

function buildMenuItems(referenceName: string): MenuItem[] {
    const statusList = getStatusList()
    const win = Zotero.getMainWindow() as Window & Record<string, PluginWindowApi | undefined>

    const items: MenuItem[] = [{ type: "menuseparator" }]

    for (const status of statusList) {
        items.push({
            type: "menuitem",
            label: `Review: ${status.label}`,
            image: status.color ? generateMenuIcon(status.color) : undefined,
            action: () => {
                setItemStatus(statusList, status)
            },
        })
    }

    items.push({ type: "menuseparator" })
    items.push({
        type: "menuitem",
        label: "Edit Review Info",
        action: () => {
            win[referenceName]?.editStatus?.()
        },
    })
    items.push({
        type: "menuitem",
        label: "Generate PRISMA Diagram",
        action: () => {
            win[referenceName]?.generatePRISMADiagram?.()
        },
    })

    return items
}

function buildMenuManagerMenus(
    win: Window,
    referenceName: string,
    statusList: ArticleStatus[],
): LibraryMenuData[] {
    const pluginWin = win as Window & Record<string, PluginWindowApi | undefined>

    const menus: LibraryMenuData[] = [{ menuType: "separator" }]

    for (const status of statusList) {
        menus.push({
            menuType: "menuitem",
            l10nID: "zra-context-review-status",
            onShowing: (_event, context) => {
                context.setL10nArgs({ status: status.label })
            },
            onCommand: () => {
                setItemStatus(statusList, status)
            },
        })
    }

    menus.push({ menuType: "separator" })
    menus.push({
        menuType: "menuitem",
        l10nID: "zra-context-edit-review",
        onCommand: () => pluginWin[referenceName]?.editStatus?.(),
    })
    menus.push({
        menuType: "menuitem",
        l10nID: "zra-context-generate-prisma",
        onCommand: () => pluginWin[referenceName]?.generatePRISMADiagram?.(),
    })

    return menus
}

export function unregisterMenuManagerMenus() {
    const menuManager = getMenuManager()
    if (!menuManager || !registeredMenuManagerId) {
        registeredMenuManagerId = null
        return
    }
    try {
        menuManager.unregisterMenu(registeredMenuManagerId)
    } catch {
        /* menu may already be gone */
    }
    registeredMenuManagerId = null
}

function registerMenuManagerMenus(win: Window, referenceName: string): boolean {
    const menuManager = getMenuManager()
    if (!menuManager) {
        return false
    }

    unregisterMenuManagerMenus()

    const { id: pluginID } = getPluginInfo()
    const statusList = getStatusList()
    const menus = buildMenuManagerMenus(win, referenceName, statusList)

    const registeredID = menuManager.registerMenu({
        menuID: LIBRARY_ITEM_REVIEW_MENU_ID,
        pluginID,
        target: "main/library/item",
        menus,
    })

    if (registeredID === false) {
        return false
    }

    registeredMenuManagerId = LIBRARY_ITEM_REVIEW_MENU_ID
    return true
}

function removeLegacyContextMenu(win: Window) {
    win.document.querySelectorAll(`[${ZRA_MENU_ATTR}]`).forEach(node => node.remove())
}

function registerLegacyContextMenu(win: Window, referenceName: string) {
    removeLegacyContextMenu(win)

    const popup = win.document.querySelector("#zotero-itemmenu")
    if (!popup) {
        return
    }

    const items = buildMenuItems(referenceName)
    for (const item of items) {
        const element = generateMenuDOM(item)
        element.setAttribute(ZRA_MENU_ATTR, "1")
        popup.appendChild(element)
    }
}

export async function registerReviewContextMenu(win: Window) {
    const { referenceName } = getPluginInfo()

    if (!registerMenuManagerMenus(win, referenceName)) {
        registerLegacyContextMenu(win, referenceName)
    }
}

export function unregisterReviewContextMenu(win: Window) {
    removeLegacyContextMenu(win)
}

export function unregisterAllReviewMenus() {
    unregisterMenuManagerMenus()
    for (const win of Zotero.getMainWindows()) {
        removeLegacyContextMenu(win)
    }
}

/** @deprecated Use registerReviewContextMenu(win) */
export async function registerContextMenu(selector: string = "#zotero-itemmenu", items: MenuItem[] = []) {
    const win = Zotero.getMainWindow()
    const popup = win.document.querySelector(selector)
    if (!popup) {
        return
    }
    for (const item of items) {
        const element = generateMenuDOM(item)
        element.setAttribute(ZRA_MENU_ATTR, "1")
        popup.appendChild(element)
    }
}
