import { describe, expect, it, vi } from "vitest"

import { registerReviewContextMenu, unregisterAllReviewMenus } from "../../src/contextMenu"
import { setPluginInfo } from "../../src/utils/pluginInfo"

vi.mock("../../src/utils/helpers", () => ({ generateMenuIcon: vi.fn() }))

describe("official Zotero menu registration", () => {
    it.each([undefined, "{}", "{"])("uses safe preferences (%s) and unregisters Zotero's returned menu IDs", async (rawPref) => {
        const win = { document: { querySelectorAll: () => [] } }
        let registerCount = 0
        const registeredIDs: string[] = []
        const registerMenu = vi.fn().mockImplementation(() => {
            registerCount += 1
            const id = `test@example.com-zra-menu-${registerCount}`
            registeredIDs.push(id)
            return id
        })
        const unregisterMenu = vi.fn()
        vi.stubGlobal("Zotero", {
            getMainWindow: () => win,
            getMainWindows: () => [win],
            Prefs: { get: () => rawPref },
            MenuManager: { registerMenu, unregisterMenu },
        })
        setPluginInfo({ id: "test@example.com", version: "test", rootURI: "file:///addon/", referenceName: "ZRA" })
        await registerReviewContextMenu(win as unknown as Window)
        const idsAfterFirstRegister = [...registeredIDs]
        await registerReviewContextMenu(win as unknown as Window)
        for (const id of idsAfterFirstRegister) {
            expect(unregisterMenu).toHaveBeenCalledWith(id)
        }
        unregisterAllReviewMenus()
        for (const id of registeredIDs.slice(idsAfterFirstRegister.length)) {
            expect(unregisterMenu).toHaveBeenCalledWith(id)
        }
    })
})
