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
const registeredMenuManagerIds: string[] = []

type MenuManagerApi = {
    registerMenu: (options: Record<string, unknown>) => void
    unregisterMenu: (menuID: string) => void
}

function getMenuManager(): MenuManagerApi | undefined {
    return (Zotero as typeof Zotero & { MenuManager?: MenuManagerApi }).MenuManager
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
    const win = Zotero.getMainWindow() as Window & Record<string, { editStatus?: () => void; generatePRISMADiagram?: () => void } | undefined>

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

function unregisterMenuManagerMenus() {
    const menuManager = getMenuManager()
    if (!menuManager) {
        return
    }
    for (const menuID of registeredMenuManagerIds) {
        try {
            menuManager.unregisterMenu(menuID)
        } catch {
            /* menu may already be gone */
        }
    }
    registeredMenuManagerIds.length = 0
}

function registerMenuManagerMenus(referenceName: string) {
    const menuManager = getMenuManager()
    if (!menuManager) {
        return false
    }

    unregisterMenuManagerMenus()

    const { id: pluginID } = getPluginInfo()
    const statusList = getStatusList()
    const win = Zotero.getMainWindow() as Window & Record<string, { editStatus?: () => void; generatePRISMADiagram?: () => void } | undefined>

    const register = (menuID: string, options: Record<string, unknown>) => {
        menuManager.registerMenu({
            target: "main/library/item",
            pluginID,
            menuID,
            ...options,
        })
        registeredMenuManagerIds.push(menuID)
    }

    register("zra-separator-start", { menuType: "separator" })

    statusList.forEach((status, index) => {
        register(`zra-status-${index}`, {
            menuType: "menuitem",
            label: `Review: ${status.label}`,
            onCommand: () => setItemStatus(statusList, status),
        })
    })

    register("zra-separator-mid", { menuType: "separator" })
    register("zra-edit-review", {
        menuType: "menuitem",
        label: "Edit Review Info",
        onCommand: () => win[referenceName]?.editStatus?.(),
    })
    register("zra-generate-prisma", {
        menuType: "menuitem",
        label: "Generate PRISMA Diagram",
        onCommand: () => win[referenceName]?.generatePRISMADiagram?.(),
    })

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

    if (!registerMenuManagerMenus(referenceName)) {
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
