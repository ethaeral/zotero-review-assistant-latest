import { beforeEach, describe, expect, it, vi } from "vitest"

import { getZoteroPref, prefKey, setZoteroPref } from "../../src/utils/prefs"
import { setPluginInfo } from "../../src/utils/pluginInfo"

const store = new Map<string, string | number | boolean>()

function createZoteroPrefs() {
    return {
        get: vi.fn((key: string, global?: boolean) => {
            if (global !== true) {
                return undefined
            }
            return store.has(key) ? store.get(key) : undefined
        }),
        set: vi.fn((key: string, value: string | number | boolean, global?: boolean) => {
            if (global !== true) {
                return
            }
            store.set(key, value)
        }),
        registerObserver: vi.fn(() => 1),
        unregisterObserver: vi.fn(),
    }
}

describe("prefs", () => {
    beforeEach(() => {
        store.clear()
        setPluginInfo({
            id: "zoteroreviewassistant@alima-webdev.com",
            version: "2.0.4",
            rootURI: "chrome://zoteroreviewassistant@alima-webdev.com/content/",
            referenceName: "Zoteroreviewassistant",
        })
        Object.assign(globalThis, { Zotero: { Prefs: createZoteroPrefs(), logError: vi.fn() } })
    })

    it("builds scaffold-aligned pref keys", () => {
        expect(prefKey("statusList")).toBe("extensions.Zoteroreviewassistant.statusList")
    })

    it("reads and writes with global=true", () => {
        setZoteroPref("commentsTagPrefix", "#Status: Comments: ")
        expect(Zotero.Prefs.set).toHaveBeenCalledWith(
            "extensions.Zoteroreviewassistant.commentsTagPrefix",
            "#Status: Comments: ",
            true,
        )
        expect(getZoteroPref("commentsTagPrefix")).toBe("#Status: Comments: ")
        expect(Zotero.Prefs.get).toHaveBeenCalledWith("extensions.Zoteroreviewassistant.commentsTagPrefix", true)
    })

    it("migrates legacy extensions.zotero.* values into the new key", () => {
        store.set("extensions.zotero.Zoteroreviewassistant.statusList", '{"legacy":true}')

        expect(getZoteroPref("statusList")).toBe('{"legacy":true}')
        expect(store.get("extensions.Zoteroreviewassistant.statusList")).toBe('{"legacy":true}')
    })

    it("migrates bare referenceName keys into the new key", () => {
        store.set("Zoteroreviewassistant.prismaTagPrefix", "#legacy#")

        expect(getZoteroPref("prismaTagPrefix")).toBe("#legacy#")
        expect(store.get("extensions.Zoteroreviewassistant.prismaTagPrefix")).toBe("#legacy#")
    })
})
